const express = require('express')
const base64 = require('base-64')
const request = require('sync-request')

const app = express()
const port = process.env.PORT || 3000

const jira = process.env.JIRA_URL || 'https://basecompany.atlassian.net'
const username = process.env.JIRA_USER || 'admin'
const password = process.env.JIRA_PASS || 'admin'
const credentials = base64.encode(`${username}:${password}`)

const headers = { headers: {
  'Authorization': `Basic ${credentials}`,
  'Accept': 'application/json'
} }

function trim (string) {
  return string ? string.replace(/(^[ /])|([ /]$)/g, '') : false
}

function getIssue (key) {
  console.log(`Fetching Jira details for ${key}`)
  const url = `${trim(jira)}/rest/api/latest/issue/${trim(key)}?fields=summary,status,assignee,priority,issuetype`
  const res = request('GET', url, headers)

  switch (res.statusCode) {
    case 200:
      const issue = JSON.parse(res.body.toString())
      return {
        key: issue.key,
        status: 200,
        content: {
          username: issue.key,
          attachments: [
            {
              mrkdwn_in: ['text'],
              fallback: `${issue.key}: ${issue.fields.summary} (${issue.fields.status.name})`,
              color: '#1E46A0',
              title: issue.fields.summary,
              title_link: `${trim(jira)}/browse/${issue.key}`,
              text: `\`${issue.fields.status.name}\` ${issue.fields.status.description}`,
              footer: `${issue.fields.priority.name} priority ${issue.fields.issuetype.name.toLowerCase()} assigned to ${issue.fields.assignee.displayName}`
            }
          ]
        }
      }
    default:
      console.log('no es bueno')
      console.log(res.body.toString())
  }
}

app.use(express.urlencoded())

app.get('/me', function (req, res) {
  try {
    const data = request('GET', `${jira}/rest/api/latest/myself`, headers)
    res.set('Content-Type', 'application/json')
      .status(data.statusCode)
      .send(data.body.toString())
  } catch (err) {
    res.set('Content-Type', 'text/plain')
      .status(500)
      .send(err)
  }
})

app.get('/issue/:key', function (req, res) {
  const issue = getIssue(req.params.key)
  res.set('Content-Type', 'application/json')
    .status(issue.status)
    .send(issue)
})

app.post('/issue', function (req, res) {
  const params = decodeURI(req.body.text).replace(/  +/g, ' ').split(' ')
  const key = `${trim(req.body.command)}-${params[0]}`

  new Promise(function (resolve) {
    resolve(getIssue(key))
  }).then(function (issue) {
    console.log('We now have the issue', issue.key)
  })
  console.log('async checking the key, getting the issue')

  res.set('Content-Type', 'plain/text')
    .status(200)
    .send('OK')
})

app.listen(port, function () {
  console.log(`Started on port ${port}`)
  console.log(`Will fetch from ${jira} as ${username}`)
})
