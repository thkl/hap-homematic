export class Network {
  makeApiRequest (data, type = 'json') {
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
          console.log('Error %s', error)
          reject(error)
        }
      })
    })
  }

  makeRequest (url, method, data) {
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
}
