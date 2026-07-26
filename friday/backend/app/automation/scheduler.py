"""FRIDAY Task Scheduler

Manages scheduled tasks, cron jobs, reminders,
and recurring automation workflows.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field

from loguru import logger


@dataclass
class ScheduledTask:
    """A task scheduled for execution."""
    id: str
    name: str
    callback: Callable
    interval_seconds: Optional[float] = None
    cron_expression: Optional[str] = None
    run_at: Optional[datetime] = None
    is_recurring: bool = False
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    config: Dict[str, Any] = field(default_factory=dict)


class TaskScheduler:
    """Scheduler for executing tasks at specified times or intervals.

    Supports one-time tasks, recurring tasks, and cron-like scheduling.
    """

    def __init__(self):
        self._tasks: Dict[str, ScheduledTask] = {}
        self._running = False
        self._loop_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start the scheduler loop."""
        if self._running:
            return

        self._running = True
        self._loop_task = asyncio.create_task(self._scheduler_loop())
        logger.info("✅ Task scheduler started")

    async def stop(self) -> None:
        """Stop the scheduler loop."""
        self._running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
            self._loop_task = None
        logger.info("Task scheduler stopped")

    def add_task(self, task: ScheduledTask) -> str:
        """Add a task to the scheduler.

        Args:
            task: The task to schedule.

        Returns:
            Task ID.
        """
        self._tasks[task.id] = task
        self._update_next_run(task)

        if task.run_at:
            logger.info(f"📅 Task '{task.name}' scheduled for {task.run_at}")
        elif task.interval_seconds:
            logger.info(f"🔄 Task '{task.name}' scheduled every {task.interval_seconds}s")

        return task.id

    def remove_task(self, task_id: str) -> bool:
        """Remove a task from the scheduler.

        Args:
            task_id: ID of the task to remove.

        Returns:
            True if task was found and removed.
        """
        if task_id in self._tasks:
            task = self._tasks.pop(task_id)
            logger.info(f"Removed task '{task.name}'")
            return True
        return False

    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a task by ID."""
        return self._tasks.get(task_id)

    def get_all_tasks(self) -> List[ScheduledTask]:
        """Get all scheduled tasks."""
        return list(self._tasks.values())

    def get_due_tasks(self) -> List[ScheduledTask]:
        """Get all tasks that are due for execution."""
        now = datetime.utcnow()
        due_tasks = []

        for task in self._tasks.values():
            if task.next_run and task.next_run <= now:
                due_tasks.append(task)

        return due_tasks

    async def _scheduler_loop(self) -> None:
        """Main scheduler loop that checks for due tasks."""
        while self._running:
            try:
                due_tasks = self.get_due_tasks()

                for task in due_tasks:
                    await self._execute_task(task)

                await asyncio.sleep(1)  # Check every second

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(5)

    async def _execute_task(self, task: ScheduledTask) -> None:
        """Execute a task and update its schedule.

        Args:
            task: The task to execute.
        """
        try:
            logger.info(f"Executing task: {task.name}")
            task.last_run = datetime.utcnow()

            if asyncio.iscoroutinefunction(task.callback):
                await task.callback(**task.config)
            else:
                task.callback(**task.config)

            logger.info(f"✅ Task '{task.name}' completed")

        except Exception as e:
            logger.error(f"❌ Task '{task.name}' failed: {e}")

        finally:
            if task.is_recurring:
                self._update_next_run(task)
            else:
                self.remove_task(task.id)

    def _update_next_run(self, task: ScheduledTask) -> None:
        """Calculate the next run time for a task.

        Args:
            task: The task to update.
        """
        now = datetime.utcnow()

        if task.run_at and not task.last_run:
            task.next_run = task.run_at
        elif task.interval_seconds:
            last = task.last_run or now
            task.next_run = last + timedelta(seconds=task.interval_seconds)
        else:
            task.next_run = None

    async def create_reminder(
        self,
        name: str,
        message: str,
        delay_seconds: float,
    ) -> str:
        """Create a simple reminder.

        Args:
            name: Reminder name.
            message: Reminder message.
            delay_seconds: Seconds until reminder fires.

        Returns:
            Task ID.
        """
        import uuid

        async def remind(msg: str):
            logger.info(f"⏰ Reminder: {msg}")

        task = ScheduledTask(
            id=str(uuid.uuid4()),
            name=name,
            callback=remind,
            run_at=datetime.utcnow() + timedelta(seconds=delay_seconds),
            config={"msg": message},
        )

        return self.add_task(task)

    async def create_recurring_task(
        self,
        name: str,
        callback: Callable,
        interval_seconds: float,
        config: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a recurring task.

        Args:
            name: Task name.
            callback: Async function to call.
            interval_seconds: Interval between executions.
            config: Optional configuration dict for the callback.

        Returns:
            Task ID.
        """
        import uuid

        task = ScheduledTask(
            id=str(uuid.uuid4()),
            name=name,
            callback=callback,
            interval_seconds=interval_seconds,
            is_recurring=True,
            next_run=datetime.utcnow(),
            config=config or {},
        )

        return self.add_task(task)
