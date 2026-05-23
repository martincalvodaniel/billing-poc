## with clarifications
```
Execute .agents/agents/orchestrator.agent.md for agent-iterations/260522-2340_discount-at-payments-fixes/main.prompt.md

Do not ask the user for a new request outside of this #tool:vscode/askQuestions
```

## direct
```
Execute .agents/agents/orchestrator.agent.md for already created main-plan agent-iterations/260522-2340_discount-at-payments-fixes/main.prompt.md

Do not create nor ask for clarifications in this iteration. Let the subagents decide if they need to ask for clarifications or not. Do not ask the user for a new request outside of this #tool:vscode/askQuestions

The last think you should prompt in this chat (at the end of the iteration) is a question with #tool:vscode/askQuestions asking the user to evaluate and answer if the task was succesfully accomplished. Do not auto-answer this question, only human user can answer.
```

# common
```
Ask the user questions to clarify requirements and gather information before starting implementation via #tool:vscode/askQuestions This iterative approach catches edge cases and non-obvious requirements BEFORE implementation begins.

If any doubt about the request or the implementation arises, do not ask the user anything; just use #tool:vscode/askQuestions for user clarification. Do not make assumptions. Always ask.

The last think you should prompt in this chat (at the end of the iteration) is a question with #tool:vscode/askQuestions asking the user to evaluate and answer if the task was succesfully accomplished. Do not auto-answer this question, only human user can answer.

Do not ask the user for a new request outside of this #tool:vscode/askQuestions
```
