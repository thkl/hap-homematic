'use strict'
var uuid, Service, StreamController

var crypto = require('crypto')
var ip = require('ip')
var path = require('path')
var spawn = require('child_process').spawn

module.exports = class FFMPEG {
  constructor (hap, name, videoConfig, log) {
    uuid = hap.uuid
    Service = hap.Service
    StreamController = hap.StreamController
    this.log = log
    this.name = name

    this.vcodec = videoConfig.vcodec
    this.audio = videoConfig.audio
    this.acodec = videoConfig.acodec
    this.packetsize = videoConfig.packetSize
    this.fps = videoConfig.maxFPS || 10
    this.maxBitrate = videoConfig.maxBitrate || 300
    this.debug = videoConfig.debug
    this.ffmpegRoot = videoConfig.ffmpegpath
    if (!videoConfig.source) {
      console.log(videoConfig)
      throw new Error('Missing source for camera.')
    }

    this.ffmpegSource = videoConfig.source
    this.ffmpegImageSource = videoConfig.stillImageSource

    this.services = []
    this.streamControllers = []

    this.pendingSessions = {}
    this.ongoingSessions = {}

    this.uploader = false

    var numberOfStreams = videoConfig.maxStreams || 2
    var videoResolutions = []

    this.maxWidth = videoConfig.maxWidth || 1280
    this.maxHeight = videoConfig.maxHeight || 720
    var maxFPS = (this.fps > 30) ? 30 : this.fps

    if (this.maxWidth >= 320) {
      if (this.maxHeight >= 240) {
        videoResolutions.push([320, 240, maxFPS])
        if (maxFPS > 15) {
          videoResolutions.push([320, 240, 15])
        }
      }

      if (this.maxHeight >= 180) {
        videoResolutions.push([320, 180, maxFPS])
        if (maxFPS > 15) {
          videoResolutions.push([320, 180, 15])
        }
      }
    }

    if (this.maxWidth >= 480) {
      if (this.maxHeight >= 360) {
        videoResolutions.push([480, 360, maxFPS])
      }

      if (this.maxHeight >= 270) {
        videoResolutions.push([480, 270, maxFPS])
      }
    }

    if (this.maxWidth >= 640) {
      if (this.maxHeight >= 480) {
        videoResolutions.push([640, 480, maxFPS])
      }

      if (this.maxHeight >= 360) {
        videoResolutions.push([640, 360, maxFPS])
      }
    }

    if (this.maxWidth >= 1280) {
      if (this.maxHeight >= 960) {
        videoResolutions.push([1280, 960, maxFPS])
      }

      if (this.maxHeight >= 720) {
        videoResolutions.push([1280, 720, maxFPS])
      }
    }

    if (this.maxWidth >= 1920) {
      if (this.maxHeight >= 1080) {
        videoResolutions.push([1920, 1080, maxFPS])
      }
    }

    let options = {
      proxy: false, // Requires RTP/RTCP MUX Proxy
      srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
      video: {
        resolutions: videoResolutions,
        codec: {
          profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
          levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
        }
      },
      audio: {
        codecs: [
          {
            type: 'OPUS', // Audio Codec
            samplerate: 24 // 8, 16, 24 KHz
          },
          {
            type: 'AAC-eld',
            samplerate: 16
          }
        ]
      }
    }

    this.createCameraControlService()
    this._createStreamControllers(numberOfStreams, options)
    this.log.debug('setting up camera done')
  }

  handleCloseConnection (connectionID) {
    this.streamControllers.forEach(function (controller) {
      controller.handleCloseConnection(connectionID)
    })
  }

  handleSnapshotRequest (request, callback) {
    let resolution = request.width + 'x' + request.height
    var imageSource = this.ffmpegImageSource !== undefined ? this.ffmpegImageSource : this.ffmpegSource
    try {
      let ffmpeg = spawn(this.ffmpegRoot, (imageSource + ' -t 1 -s ' + resolution + ' -f image2 -').split(' '), { env: process.env })
      var imageBuffer = Buffer.alloc(0)
      this.log.debug('Snapshot from ' + this.name + ' at ' + resolution)
      // this.log.debug('ffmpeg '+imageSource + ' -t 1 -s '+ resolution + ' -f image2 -');
      ffmpeg.stdout.on('data', function (data) {
        imageBuffer = Buffer.concat([imageBuffer, data])
      })
      ffmpeg.on('close', function (code) {
        callback(null, imageBuffer)
      })
      ffmpeg.on('error', function (err) {
        console.log('Oh noez, teh errurz: ' + err)
      })
    } catch (e) {
      this.log.error('Snapshot : Error while calling ffmpef')
    }
  }

  prepareStream (request, callback) {
    var sessionInfo = {}

    let sessionID = request['sessionID']
    let targetAddress = request['targetAddress']

    sessionInfo['address'] = targetAddress

    var response = {}

    let videoInfo = request['video']
    if (videoInfo) {
      let targetPort = videoInfo['port']
      let srtpKey = videoInfo['srtp_key']
      let srtpSalt = videoInfo['srtp_salt']

      // SSRC is a 32 bit integer that is unique per stream
      let ssrcSource = crypto.randomBytes(4)
      ssrcSource[0] = 0
      let ssrc = ssrcSource.readInt32BE(0, true)

      let videoResp = {
        port: targetPort,
        ssrc: ssrc,
        srtp_key: srtpKey,
        srtp_salt: srtpSalt
      }

      response['video'] = videoResp

      sessionInfo['video_port'] = targetPort
      sessionInfo['video_srtp'] = Buffer.concat([srtpKey, srtpSalt])
      sessionInfo['video_ssrc'] = ssrc
    }

    let audioInfo = request['audio']
    if (audioInfo) {
      let targetPort = audioInfo['port']
      let srtpKey = audioInfo['srtp_key']
      let srtpSalt = audioInfo['srtp_salt']

      // SSRC is a 32 bit integer that is unique per stream
      let ssrcSource = crypto.randomBytes(4)
      ssrcSource[0] = 0
      let ssrc = ssrcSource.readInt32BE(0, true)

      let audioResp = {
        port: targetPort,
        ssrc: ssrc,
        srtp_key: srtpKey,
        srtp_salt: srtpSalt
      }

      response['audio'] = audioResp

      sessionInfo['audio_port'] = targetPort
      sessionInfo['audio_srtp'] = Buffer.concat([srtpKey, srtpSalt])
      sessionInfo['audio_ssrc'] = ssrc
    }

    let currentAddress = ip.address()
    var addressResp = {
      address: currentAddress
    }

    if (ip.isV4Format(currentAddress)) {
      addressResp['type'] = 'v4'
    } else {
      addressResp['type'] = 'v6'
    }

    response['address'] = addressResp
    this.pendingSessions[uuid.unparse(sessionID)] = sessionInfo

    callback(response)
  }

  handleStreamRequest (request) {
    var sessionID = request['sessionID']
    var requestType = request['type']
    if (sessionID) {
      let sessionIdentifier = uuid.unparse(sessionID)

      if (requestType === 'start') {
        var sessionInfo = this.pendingSessions[sessionIdentifier]
        if (sessionInfo) {
          var width = 1280
          var height = 720
          var fps = this.fps || 30
          var vbitrate = this.maxBitrate
          var abitrate = 32
          var asamplerate = 16
          var vcodec = this.vcodec || 'libx264'
          var acodec = this.acodec || 'libfdk_aac'
          var packetsize = this.packetsize || 1316 // 188 376

          let videoInfo = request['video']
          if (videoInfo) {
            width = videoInfo['width']
            height = videoInfo['height']

            let expectedFPS = videoInfo['fps']
            if (expectedFPS < fps) {
              fps = expectedFPS
            }
            if (videoInfo['max_bit_rate'] < vbitrate) {
              vbitrate = videoInfo['max_bit_rate']
            }
          }

          let audioInfo = request['audio']
          if (audioInfo) {
            abitrate = audioInfo['max_bit_rate']
            asamplerate = audioInfo['sample_rate']
          }

          let targetAddress = sessionInfo['address']
          let targetVideoPort = sessionInfo['video_port']
          let videoKey = sessionInfo['video_srtp']
          let videoSsrc = sessionInfo['video_ssrc']
          let targetAudioPort = sessionInfo['audio_port']
          let audioKey = sessionInfo['audio_srtp']
          let audioSsrc = sessionInfo['audio_ssrc']
          this.log.debug('Streaming from ' + this.name)
          let ffmpegCommand = this.ffmpegSource + ' -map 0:0' +
          ' -vcodec ' + vcodec +
          ' -pix_fmt yuv420p' +
          ' -r ' + fps +
          ' -f rawvideo -tune zerolatency' +
          ' -vf scale=' + width + ':' + height +
          ' -b:v ' + vbitrate + 'k' +
          ' -bufsize ' + vbitrate + 'k' +
          ' -payload_type 99' +
          ' -ssrc ' + videoSsrc +
          ' -f rtp' +
          ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
          ' -srtp_out_params ' + videoKey.toString('base64') +
          ' srtp://' + targetAddress + ':' + targetVideoPort +
          '?rtcpport=' + targetVideoPort +
          '&localrtcpport=' + targetVideoPort +
          '&pkt_size=' + packetsize

          if (this.audio) {
            ffmpegCommand += ' -map 0:1' +
            ' -acodec ' + acodec +
            ' -profile:a aac_eld' +
            ' -flags +global_header' +
            ' -f null' +
            ' -ar ' + asamplerate + 'k' +
            ' -b:a ' + abitrate + 'k' +
            ' -bufsize ' + abitrate + 'k' +
            ' -ac 1' +
            ' -payload_type 110' +
            ' -ssrc ' + audioSsrc +
            ' -f rtp' +
            ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
            ' -srtp_out_params ' + audioKey.toString('base64') +
            ' srtp://' + targetAddress + ':' + targetAudioPort +
            '?rtcpport=' + targetAudioPort +
            '&localrtcpport=' + targetAudioPort +
            '&pkt_size=' + packetsize
          }
          try {
            let ffmpeg = spawn(this.ffmpegRoot, ffmpegCommand.split(' '), { env: process.env })
            this.log.debug('Start streaming video from ' + this.name + ' with ' + width + 'x' + height + '@' + vbitrate + 'kBit')
            if (this.debug) {
              this.log.debug('ffmpeg ' + ffmpegCommand)
              ffmpeg.stderr.on('data', function (data) {
                console.log(data.toString())
              })
            }
            let self = this

            ffmpeg.on('error', function (err) {
              console.log('Oh noez, teh errurz: ' + err)
            })

            ffmpeg.on('close', (code) => {
              if (code == null || code === 0 || code === 255) {
                self.log.debug('Stopped streaming')
              } else {
                self.log.debug('ERROR: FFmpeg exited with code ' + code)
                for (var i = 0; i < self.streamControllers.length; i++) {
                  var controller = self.streamControllers[i]
                  if (controller.sessionIdentifier === sessionID) {
                    controller.forceStop()
                  }
                }
              }
            })
            this.ongoingSessions[sessionIdentifier] = ffmpeg
          } catch (e) {
            this.log.error('Stream: Error while launching ffmpeg')
          }
        }

        delete this.pendingSessions[sessionIdentifier]
      } else if (requestType === 'stop') {
        var ffmpegProcess = this.ongoingSessions[sessionIdentifier]
        if (ffmpegProcess) {
          ffmpegProcess.kill('SIGTERM')
        }
        delete this.ongoingSessions[sessionIdentifier]
      }
    }
  }

  createCameraControlService () {
    var controlService = new Service.CameraControl()

    this.services.push(controlService)

    if (this.audio) {
      var microphoneService = new Service.Microphone()
      this.services.push(microphoneService)
    }
  }

  // Private

  _createStreamControllers (maxStreams, options) {
    let self = this

    for (var i = 0; i < maxStreams; i++) {
      var streamController = new StreamController(i, options, self)

      self.services.push(streamController.service)
      self.streamControllers.push(streamController)
    }
  }
}
