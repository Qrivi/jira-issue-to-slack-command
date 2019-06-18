const express = require('express')
const bodyParser = require('body-parser')
const base64 = require('base-64')
const syncRequest = require('sync-request')
const asyncRequest = require('then-request')

const app = express()
const port = process.env.PORT || 3000

const jira = process.env.JIRA_URL || 'https://basecompany.atlassian.net'
const username = process.env.JIRA_USER || 'admin'
const password = process.env.JIRA_PASS || 'admin'
const credentials = base64.encode(`${username}:${password}`)
const headers = { headers: { 'Authorization': `Basic ${credentials}` } }

function trim(string){
  return string ? string.replace( /(^[ \/])|([ \/]$)/g, '') : false
}

app.use(express.json());

app.get('/', function (req, res) {
  console.log('Got a GET')

  try {
    const call = syncRequest('GET', `${jira}/rest/api/latest/myself`, headers)
    res.setHeader('Content-Type', 'application/json')
      .status(call.statusCode).send(res.body.toString())
  } catch (err) {
    res.setHeader('Content-Type', 'text/plain')
      .status(500).send(err)
  }
})

app.post('/', function (req, res) {
  console.log('Got a POST')

  const key = trim(req.body.command);
  const params = decodeURI(req.body.text).split(' ')


  asyncRequest('GET', `${jira}/rest/api/2/issue/${key}?fields=summary,status`)
  res.end('yes')
})

app.listen(port, function () {
  console.log(`Started on port ${port}`)
})
