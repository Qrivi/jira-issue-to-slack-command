# jira-issue-to-slack-command

This very creatively name project provides a simple endpoint for a Slack command that will return a Jira issue's details and post them to Slack.

Recently at work there was a team merge, and whereas I and my original team mates were very fond of Jira's own Slack app and its issue expanding feature when it detects an issue key in the chat, the guys from the other team disagreed (boo), so we disabled that function entirely. In their opinion Jirabot was too spammy when discussing multiple projects at once or during intensive dialogue when multiple projects are mentioned — and honestly they are not completely wrong here: it does break up the conversation.

Because Jirabot cannot be configured to expand in a thread or is not smart enough not to repeat herself too often, this project provides a quick solution that just adds one manual step.
