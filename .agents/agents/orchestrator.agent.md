BASE=agent-iterations
TOPIC=$BASE/03-docker-compose-for-it-and-at
SUBTOPIC=02-fix-its-and-ats
PROMPT=main

Execute $TOPIC/$SUBTOPIC/$PROMPT.prompt.md with this constraints:

* Plan phase in a subagent (not in the main agent) whose output must be stored into $TOPIC/$SUBTOPIC/agents-logs/01_$PROMPT-plan.prompt.md. Will be called "planner"
  * This plan must indicate its phases and describe if they are parallelizable and dependencies between them
* Main agent ONLY and ALWAYS:
  * Must never write a file (subagents will)
  * Must orchestrate different subagents for the execution of the plan phases (in parallel whenever is possible)
  * Must be called "orchestrator"
* Store the outputs of every agent/subagent into $TOPIC/$SUBTOPIC/agents-logs/$CORRELATED_NUMERIC_PREFIX_$SUBAGENT_NAME (CORRELATED_NUMERIC_PREFIX is a sequential number to correlate the different outputs and execution order of the agents/subagents; 01 was used for the planner, so the next subagent will be 02)
* Clarifications requested to the user via the #tool:vscode/askQuestions must be stored with their questions into $TOPIC/$SUBTOPIC/clarifications; the subagent in charge of this must be called "clarifier"
* All agents and subagents must execute this llm model: `Claude Opus 4.8`
* All agents and subagents must assume total bypass approvals for using tools and only stop when using #tool:vscode/askQuestions is needed
* At the end of the implementation, always create a final file (at $TOPIC/$SUBTOPIC/commit-message.md) with a good commit message for all the changes. The user may copy this commit message directly or edit it before committing. Never auto-commit or auto-push code.

Ask the user questions to clarify requirements and gather information before starting implementation via #tool:vscode/askQuestions This iterative approach catches edge cases and non-obvious requirements BEFORE implementation begins.

If any doubt about the request or the implementation arises, do not ask the user anything; just use #tool:vscode/askQuestions for user clarification. Do not make assumptions. Always ask.

The last think you should prompt in this chat (at the end of the iteration) is a question with #tool:vscode/askQuestions asking the user to evaluate and answer if the task was succesfully accomplished. Do not auto-answer this question, only human user can answer.
