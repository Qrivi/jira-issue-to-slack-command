# jira-issue-to-slack-command

This very creatively name project provides a simple endpoint for a Slack command that will return a Jira issue's details and post them to Slack.
Because Jirabot cannot be configured to expand in a thread or is not smart enough not to repeat herself too often, this project provides a quick solution that just adds one manual step — typing the command.

> Recently at work there was a team merge, and whereas I and my original team mates were very fond of Jira's own Slack app and its issue expanding feature when it detects a key in the chat, the guys from the other team disagreed (boo). So we disabled that function entirely. In their opinion Jirabot was too spammy when discussing multiple projects at once or during intensive dialogue when multiple projects are mentioned — and honestly they are not completely wrong here: it does break up the conversation.

Introducing: jira-issue-to-slack-command.

![Screenshot](https://i.imgur.com/0l6Den8.jpg)

## Setup
Easy!
- Deploy to a server of your liking, and make sure the required environment variables are set (see `.env.example`).
- [Create a Slack app](https://api.slack.com/apps?new_app=1) and add one or more slash commands. The command itself will be used as the project identifier on Jira, and the request URL should point to the `/issue` endpoint of this project.
- Profit

## Usage
Once installed in your team's workspace, trigger the command and that's about it. Add `me` to the end to have the response only visible to you. E.g. in the Screenshot I used above I typed `/tank 1939`, and if I would have wanted to have that status only be visible to me, I had typed `/tank 1939 me`.
