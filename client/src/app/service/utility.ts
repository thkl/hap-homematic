import { HttpResponse } from "@angular/common/http";

export const sortObject = (a: any, b: any, field: string, dir: string) => {

  if (a[field] < b[field]) {
    return (dir === 'asc') ? 1 : -1;
  }
  if (a[field] > b[field]) {
    return (dir === 'desc') ? -1 : 1;
  }

  return 0;
};

export const filterObjects = (item: any, filter: string, names: string[]) => {
  let result = false;
  if (names.length === 0) {
    return true;
  }
  names.forEach((aName) => {
    if (item[aName]) {
      if (item[aName].toLowerCase().indexOf(filter.toLowerCase()) !== -1)
        result = true;
    }
  });
  return result;
};


export const isNewerVersion = (oldVer: string, newVer: string) => {
  const oldParts = oldVer.split('.')
  const newParts = newVer.split('.')
  for (let i = 0; i < newParts.length; i++) {
    const a = ~~newParts[i] // parse int
    const b = ~~oldParts[i] // parse int
    if (a > b) return true
    if (a < b) return false
  }
  return false
}


export const getFileName = (response: HttpResponse<Blob>, defaultName: string) => {
  let filename: string;
  try {
    const contentDisposition: string = response.headers.get('content-disposition');
    const r = /(?:filename=")(.+)(?:;")/
    filename = r.exec(contentDisposition)[1];
  }
  catch (e) {
    filename = defaultName;
  }
  return filename
}
