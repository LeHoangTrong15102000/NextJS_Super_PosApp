// Mock for query-string ESM package (not compatible with Jest CJS)
module.exports = {
  stringify: (obj, options) => {
    const params = new URLSearchParams()
    if (obj) {
      Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return params.toString()
  },
  parse: (str) => {
    const params = new URLSearchParams(str)
    const result = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  },
  stringifyUrl: ({ url, query }) => {
    const queryStr = module.exports.stringify(query)
    return queryStr ? `${url}?${queryStr}` : url
  },
  parseUrl: (url) => {
    const [base, query] = url.split('?')
    return { url: base, query: module.exports.parse(query || '') }
  }
}

