export class Network {
  constructor (sid) {
    this.sid = sid
  }

  makeApiRequest (data, type = 'json') {
    data.sid = this.sid
    console.log('API Request %s', JSON.stringify(data))
    return new Promise((resolve, reject) => {
      $.ajax({
        dataType: type,
        url: '/api/',
        data: data,
        method: 'POST',
        success: (responseData) => {
          console.log('Result %s', JSON.stringify(responseData))
          resolve(responseData)
        },
        error: (error) => {
          console.log('Error %s', JSON.stringify(error))
          reject(error)
        }
      })
    })
  }

  makeRequest (url, method, data = {}) {
    data.sid = this.sid
    console.log('Generic Request Url:%s Data:%s', url, JSON.stringify(data))
    return new Promise((resolve, reject) => {
      $.ajax({
        dataType: 'json',
        url: url,
        data: data,
        method: method,
        success: (responseData) => {
          console.log('Result %s', JSON.stringify(responseData))
          resolve(responseData)
        },
        error: (error) => {
          console.log('Error %s', error)
          reject(error)
        }
      })
    })
  }


  makeFormRequest (url,form) {
    form.append('sid',this.sid)
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        data: form,
        method: 'POST',
        contentType: false,
        processData: false,
        success: (responseData) => {
          console.log('Result %s', JSON.stringify(responseData))
          resolve(responseData)
        },
        error: (error) => {
          console.log('Error %s', error)
          reject(error)
        }
      })
    })
  }
}
