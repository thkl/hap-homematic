export class Network {
  makeApiRequest (data) {
    return new Promise((resolve, reject) => {
      $.ajax({
        dataType: 'json',
        url: '/api/',
        data: data,
        method: 'POST',
        success: function (responseData) {
          console.log('API Request %s \n\nResult %s', JSON.stringify(data), JSON.stringify(responseData))
          resolve(responseData)
        },
        failure: function (error) {
          reject(error)
        }
      })
    })
  }

  makeRequest (url, method, data) {
    return new Promise((resolve, reject) => {
      $.ajax({
        dataType: 'json',
        url: url,
        data: data,
        method: method,
        success: function (responseData) {
          console.log('Request %s - %s \n\nResult %s', url, JSON.stringify(data), JSON.stringify(responseData))
          resolve(responseData)
        },
        failure: function (error) {
          reject(error)
        }
      })
    })
  }
}
