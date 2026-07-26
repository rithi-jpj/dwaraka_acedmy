"""FRIDAY Workflow Engine

Orchestrates multi-step automation workflows with
conditional logic, error handling, and state management.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from loguru import logger


class WorkflowStepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowStep:
    """A single step in a workflow."""

    def __init__(
        self,
        name: str,
        action: Callable,
        condition: Optional[Callable] = None,
        timeout: float = 300,
        retry_count: int = 0,
        depends_on: Optional[List[str]] = None,
    ):
        self.id = str(uuid.uuid4())
        self.name = name
        self.action = action
        self.condition = condition
        self.timeout = timeout
        self.retry_count = retry_count
        self.depends_on = depends_on or []
        self.status = WorkflowStepStatus.PENDING
        self.result: Any = None
        self.error: Optional[str] = None
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None


class Workflow:
    """A workflow consisting of multiple steps."""

    def __init__(self, name: str, description: str = ""):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.steps: List[WorkflowStep] = []
        self.status = WorkflowStatus.PENDING
        self.context: Dict[str, Any] = {}
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None

    def add_step(self, step: WorkflowStep) -> "Workflow":
        """Add a step to the workflow."""
        self.steps.append(step)
        return self

    def set_context(self, key: str, value: Any) -> None:
        """Set a context value for the workflow."""
        self.context[key] = value


class WorkflowEngine:
    """Engine for executing multi-step workflows."""

    def __init__(self):
        self._workflows: Dict[str, Workflow] = {}
        self._running_workflows: Dict[str, asyncio.Task] = {}

    def create_workflow(self, name: str, description: str = "") -> Workflow:
        """Create a new workflow.

        Args:
            name: Workflow name.
            description: Optional description.

        Returns:
            The created workflow instance.
        """
        workflow = Workflow(name=name, description=description)
        self._workflows[workflow.id] = workflow
        return workflow

    async def execute_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Execute a workflow by ID.

        Args:
            workflow_id: ID of the workflow to execute.

        Returns:
            Workflow execution results.
        """
        workflow = self._workflows.get(workflow_id)
        if not workflow:
            return {"success": False, "error": "Workflow not found"}

        if workflow.status == WorkflowStatus.RUNNING:
            return {"success": False, "error": "Workflow is already running"}

        # Start execution in background
        task = asyncio.create_task(self._run_workflow(workflow))
        self._running_workflows[workflow_id] = task

        return {"success": True, "workflow_id": workflow_id}

    async def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a workflow.

        Args:
            workflow_id: ID of the workflow.

        Returns:
            Workflow status information.
        """
        workflow = self._workflows.get(workflow_id)
        if not workflow:
            return None

        return {
            "id": workflow.id,
            "name": workflow.name,
            "status": workflow.status.value,
            "steps": [
                {
                    "name": s.name,
                    "status": s.status.value,
                    "error": s.error,
                }
                for s in workflow.steps
            ],
            "progress": self._calculate_progress(workflow),
            "created_at": workflow.created_at.isoformat(),
            "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
        }

    async def cancel_workflow(self, workflow_id: str) -> bool:
        """Cancel a running workflow.

        Args:
            workflow_id: ID of the workflow to cancel.

        Returns:
            True if cancelled successfully.
        """
        task = self._running_workflows.get(workflow_id)
        if task and not task.done():
            task.cancel()
            if workflow_id in self._workflows:
                self._workflows[workflow_id].status = WorkflowStatus.CANCELLED
            return True
        return False

    async def _run_workflow(self, workflow: Workflow) -> None:
        """Execute all steps of a workflow in order.

        Args:
            workflow: The workflow to execute.
        """
        logger.info(f"🚀 Starting workflow: {workflow.name}")
        workflow.status = WorkflowStatus.RUNNING
        workflow.started_at = datetime.utcnow()

        completed_steps = set()

        try:
            while len(completed_steps) < len(workflow.steps):
                for step in workflow.steps:
                    if step.status != WorkflowStepStatus.PENDING:
                        continue

                    # Check dependencies
                    deps_met = all(
                        any(s.id == dep_id and s.status == WorkflowStepStatus.COMPLETED
                            for s in workflow.steps if s.id == dep_id)
                        for dep_id in step.depends_on
                    )
                    if not deps_met:
                        continue

                    # Check condition
                    if step.condition and not step.condition(workflow.context):
                        step.status = WorkflowStepStatus.SKIPPED
                        logger.info(f"⏭️ Step '{step.name}' skipped (condition not met)")
                        continue

                    # Execute step
                    await self._execute_step(step, workflow.context)
                    completed_steps.add(step.id)

                if not any(s.status == WorkflowStepStatus.PENDING for s in workflow.steps):
                    break

                await asyncio.sleep(0.1)

            # Check if all steps completed
            all_completed = all(
                s.status in (WorkflowStepStatus.COMPLETED, WorkflowStepStatus.SKIPPED)
                for s in workflow.steps
            )
            workflow.status = WorkflowStatus.COMPLETED if all_completed else WorkflowStatus.FAILED

        except asyncio.CancelledError:
            workflow.status = WorkflowStatus.CANCELLED
            logger.info(f"Workflow '{workflow.name}' cancelled")
        except Exception as e:
            workflow.status = WorkflowStatus.FAILED
            logger.error(f"Workflow '{workflow.name}' failed: {e}")

        workflow.completed_at = datetime.utcnow()
        logger.info(
            f"{'✅' if workflow.status == WorkflowStatus.COMPLETED else '❌'} "
            f"Workflow '{workflow.name}': {workflow.status.value}"
        )

    async def _execute_step(self, step: WorkflowStep, context: Dict[str, Any]) -> None:
        """Execute a single workflow step with retry logic.

        Args:
            step: The step to execute.
            context: Workflow context dictionary.
        """
        step.status = WorkflowStepStatus.RUNNING
        step.started_at = datetime.utcnow()
        logger.info(f"Executing step: {step.name}")

        for attempt in range(step.retry_count + 1):
            try:
                if asyncio.iscoroutinefunction(step.action):
                    result = await asyncio.wait_for(
                        step.action(context),
                        timeout=step.timeout,
                    )
                else:
                    result = step.action(context)

                step.result = result
                step.status = WorkflowStepStatus.COMPLETED
                step.completed_at = datetime.utcnow()
                logger.info(f"✅ Step '{step.name}' completed")
                return

            except asyncio.TimeoutError:
                step.error = f"Timeout after {step.timeout}s"
                logger.warning(f"⏰ Step '{step.name}' timed out (attempt {attempt + 1})")
            except Exception as e:
                step.error = str(e)
                logger.warning(f"❌ Step '{step.name}' failed (attempt {attempt + 1}): {e}")

                if attempt < step.retry_count:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

        step.status = WorkflowStepStatus.FAILED
        step.completed_at = datetime.utcnow()

    def _calculate_progress(self, workflow: Workflow) -> float:
        """Calculate workflow progress as a percentage.

        Args:
            workflow: The workflow to check.

        Returns:
            Progress percentage (0.0 to 100.0).
        """
        if not workflow.steps:
            return 100.0

        completed = sum(
            1 for s in workflow.steps
            if s.status in (WorkflowStepStatus.COMPLETED, WorkflowStepStatus.SKIPPED)
        )
        return (completed / len(workflow.steps)) * 100.0
