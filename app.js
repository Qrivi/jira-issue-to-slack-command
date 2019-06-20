#!/usr/bin/env node
require('dotenv').config()

const express = require('express')
const base64 = require('base-64')
const request = require('sync-request')

const app = express()
const port = process.env.PORT || 3000

const jira = process.env.JIRA_URL || 'https://jira.atlassian.net'
const username = process.env.JIRA_USER || 'admin'
const password = process.env.JIRA_PASS || 'admin'
const credentials = base64.encode(`${username}:${password}`)
const flagField = process.env.JIRA_FLAG || 'customfield_10000'

const headers = { headers: {
  'Authorization': `Basic ${credentials}`,
  'Accept': 'application/json'
} }

// Removes leading and trailing slashes and spaces from `string`.
function trim (string) {
  return string ? string.replace(/(^[ /])|([ /]$)/g, '') : false
}

// Formats `issue` so Slack can understand it.
function format (issue, ephemeral) {
  switch (issue.statusCode) {
    case 200:
      const calculatedProgress = progress(issue.subtasks)
      if (calculatedProgress) {
        issue.progress = `, ${calculatedProgress}`
      } else {
        issue.progress = ''
      }
      return {
        response_type: ephemeral ? 'ephemeral' : 'in_channel',
        attachments: [
          {
            mrkdwn_in: ['text', 'pretext'],
            fallback: `${issue.key}: ${issue.summary} (${issue.status.name})`,
            color: '#1E46A0',
            pretext: `*${issue.key}*:`,
            title: issue.summary,
            title_link: `${trim(jira)}/browse/${issue.key}`,
            text: `\`${issue.status.name}\` ${issue.status.description} ${flag(issue)}`,
            footer: `${issue.priority.name} priority ${issue.issuetype.name.toLowerCase()} assigned to ${issue.assignee.displayName}${issue.progress}`
          }
        ]
      }
    case 404:
      return {
        response_type: 'ephemeral',
        attachments: [
          {
            mrkdwn_in: ['pretext'],
            fallback: `${issue.key}: Issue does not exist or I don't have permission to see it`,
            color: '#ff0000',
            pretext: `*${issue.key}*:`,
            title: `Issue does not exist or I don't have permission to see it`,
            title_link: `${trim(jira)}/browse/${issue.key}`
          }
        ]
      }
    default:
      return {
        response_type: 'ephemeral',
        attachments: [
          {
            mrkdwn_in: ['pretext'],
            fallback: `${issue.key}: Something went wrong internally when I tried to process your request`,
            color: '#ff0000',
            pretext: `*${issue.key}*:`,
            title: 'Something went wrong internally when I tried to process your request',
            title_link: `${trim(jira)}/browse/${issue.key}`
          }
        ]
      }
  }
}

// Fetches issue `key` from Jira.
function fetch (key) {
  const url = `${trim(jira)}/rest/api/latest/issue/${trim(key)}?fields=summary,status,assignee,priority,issuetype,subtasks,${flagField}`
  const res = request('GET', url, headers)

  if (res.statusCode !== 200) {
    return { statusCode: res.statusCode }
  }

  return {
    statusCode: 200,
    key: key.toUpperCase(),
    ...JSON.parse(res.body.toString()).fields
  }
}

// Checks if `issue` is flagged.
function flag (issue) {
  return issue[flagField] && issue[flagField][0].value === 'Impediment' ? '🚩' : ''
}

// Returns percentage of completion of the `subtasks`.
function progress (subtasks) {
  if (!subtasks || !subtasks.length) {
    return false
  }

  const donetasks = subtasks.map(task => task.fields.status.statusCategory).filter(status => status.key === 'done')
  return `${Math.floor((donetasks.length / subtasks.length) * 100)}% done`
}

// Set up Express.
app.use(express.urlencoded({ extended: true }))

// Endpoint to verify that authentication with Jira was successful.
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

// GET endpoint, so the output can easily be checked in the browser, just in case.
app.get('/issue/:key', function (req, res) {
  const issue = fetch(req.params.key)
  res.set('Content-Type', 'application/json')
    .status(issue.statusCode)
    .send({ ...issue, message: format(issue) })
})

// POST endpoint, an entrypoint for Slack.
app.post('/issue', function (req, res) {
  const params = decodeURI(req.body.text).replace(/  +/g, ' ').split(' ')
  const key = `${trim(req.body.command)}-${params[0]}`

  const callback = req.body.response_url
  const ephemeral = params[1] === 'me'

  new Promise(function (resolve) {
    resolve(fetch(key))
  }).then(function (issue) {
    request('POST', callback, { json: format(issue, ephemeral) })
  })

  res.status(200).end()
})

// If speaking is silver, then listening is gold.
app.listen(port, function () {
  console.log(`Started on port ${port}, fetching from ${jira} as ${username}`)
})
