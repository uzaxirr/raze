"""API call logging module for tracking Agno agent interactions."""

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path
import asyncio
from functools import wraps

# Configure dedicated logger for API calls
api_logger = logging.getLogger("agno_api")
api_logger.setLevel(logging.INFO)

# Create logs directory if it doesn't exist
log_dir = Path(__file__).parent.parent / "logs"
log_dir.mkdir(exist_ok=True)

# File handler for API logs with rotation
from logging.handlers import RotatingFileHandler

api_log_file = log_dir / "api_calls.log"
file_handler = RotatingFileHandler(
    api_log_file,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=5,
    encoding="utf-8"
)
file_handler.setLevel(logging.INFO)

# JSON formatter for structured logging
class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields if present
        if hasattr(record, "api_data"):
            log_obj.update(record.api_data)

        return json.dumps(log_obj, default=str)

# Set formatter
json_formatter = JSONFormatter()
file_handler.setFormatter(json_formatter)
api_logger.addHandler(file_handler)

# Also add console handler for important API events
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.WARNING)
console_formatter = logging.Formatter(
    '%(asctime)s - API - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(console_formatter)
api_logger.addHandler(console_handler)


class APICallTracker:
    """Track and log API calls with timing and response metrics."""

    def __init__(self, operation: str, user_id: Optional[str] = None):
        """Initialize API call tracker.

        Args:
            operation: Name of the API operation
            user_id: Optional user identifier
        """
        self.operation = operation
        self.user_id = user_id
        self.start_time = None
        self.request_data = {}
        self.response_data = {}
        self.error = None
        self.status_code = None

    def __enter__(self):
        """Start tracking the API call."""
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Complete tracking and log the API call."""
        duration = time.time() - self.start_time if self.start_time else 0

        log_data = {
            "api_data": {
                "operation": self.operation,
                "user_id": self.user_id,
                "duration_seconds": round(duration, 3),
                "duration_ms": round(duration * 1000, 2),
                "success": exc_type is None,
                "request": self.request_data,
                "response": self.response_data,
            }
        }

        if exc_type is not None:
            log_data["api_data"]["error"] = {
                "type": exc_type.__name__,
                "message": str(exc_val),
            }
            self.error = exc_val

        if self.status_code:
            log_data["api_data"]["status_code"] = self.status_code

        # Log at appropriate level
        if exc_type is not None:
            api_logger.error(
                f"API call failed: {self.operation} ({duration:.2f}s)",
                extra=log_data
            )
        elif duration > 10:  # Slow API call warning
            api_logger.warning(
                f"Slow API call: {self.operation} took {duration:.2f}s",
                extra=log_data
            )
        else:
            api_logger.info(
                f"API call completed: {self.operation} ({duration:.2f}s)",
                extra=log_data
            )

        # Don't suppress exceptions
        return False

    def set_request(self, **kwargs):
        """Set request data for logging."""
        self.request_data = self._sanitize_data(kwargs)

    def set_response(self, data: Any, status_code: Optional[int] = None):
        """Set response data for logging."""
        self.response_data = self._sanitize_data(data)
        self.status_code = status_code

    @staticmethod
    def _sanitize_data(data: Any) -> Any:
        """Sanitize data for logging (truncate large payloads, remove sensitive info)."""
        if data is None:
            return None

        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                # Skip sensitive fields
                if key.lower() in ["password", "token", "secret", "api_key"]:
                    sanitized[key] = "***REDACTED***"
                elif isinstance(value, str) and len(value) > 1000:
                    sanitized[key] = value[:1000] + "...[truncated]"
                elif isinstance(value, (dict, list)):
                    sanitized[key] = APICallTracker._sanitize_data(value)
                else:
                    sanitized[key] = value
            return sanitized

        elif isinstance(data, list):
            if len(data) > 100:
                return data[:100] + ["...[truncated]"]
            return [APICallTracker._sanitize_data(item) for item in data]

        elif isinstance(data, str):
            if len(data) > 5000:
                return data[:5000] + "...[truncated]"
            return data

        else:
            return data


def log_api_call(operation: str):
    """Decorator for logging async API calls."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id if available
            user_id = kwargs.get("user_id") or kwargs.get("telegram_user_id")

            with APICallTracker(operation, user_id) as tracker:
                # Log request parameters
                tracker.set_request(
                    args=args[1:] if args else [],  # Skip self
                    kwargs=kwargs
                )

                try:
                    result = await func(*args, **kwargs)
                    tracker.set_response(result)
                    return result
                except Exception as e:
                    # Re-raise the exception after logging
                    raise

        return wrapper
    return decorator


def log_streaming_api_call(operation: str):
    """Decorator for logging streaming API calls."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id if available
            user_id = kwargs.get("user_id") or kwargs.get("telegram_user_id")

            tracker = APICallTracker(operation, user_id)
            tracker.start_time = time.time()

            # Log request parameters
            tracker.set_request(
                args=args[1:] if args else [],  # Skip self
                kwargs=kwargs
            )

            chunk_count = 0
            total_content_length = 0
            first_chunk_time = None

            try:
                async for chunk in func(*args, **kwargs):
                    chunk_count += 1

                    if first_chunk_time is None:
                        first_chunk_time = time.time()
                        time_to_first_chunk = first_chunk_time - tracker.start_time
                        api_logger.debug(
                            f"First chunk received for {operation} after {time_to_first_chunk:.2f}s"
                        )

                    # Track content length
                    if hasattr(chunk, "content"):
                        total_content_length += len(chunk.content) if chunk.content else 0

                    yield chunk

                # Log completion
                duration = time.time() - tracker.start_time
                tracker.set_response({
                    "chunk_count": chunk_count,
                    "total_content_length": total_content_length,
                    "time_to_first_chunk": time_to_first_chunk if first_chunk_time else None,
                    "streaming_duration": duration
                })

                log_data = {
                    "api_data": {
                        "operation": tracker.operation,
                        "user_id": tracker.user_id,
                        "duration_seconds": round(duration, 3),
                        "success": True,
                        "request": tracker.request_data,
                        "response": tracker.response_data,
                    }
                }

                api_logger.info(
                    f"Streaming API call completed: {operation} ({duration:.2f}s, {chunk_count} chunks)",
                    extra=log_data
                )

            except Exception as e:
                duration = time.time() - tracker.start_time
                log_data = {
                    "api_data": {
                        "operation": tracker.operation,
                        "user_id": tracker.user_id,
                        "duration_seconds": round(duration, 3),
                        "success": False,
                        "request": tracker.request_data,
                        "error": {
                            "type": type(e).__name__,
                            "message": str(e),
                        },
                        "chunks_before_error": chunk_count
                    }
                }

                api_logger.error(
                    f"Streaming API call failed: {operation} after {chunk_count} chunks",
                    extra=log_data
                )
                raise

        return wrapper
    return decorator


class APIMetrics:
    """Track and report API metrics."""

    def __init__(self):
        self.call_counts = {}
        self.total_durations = {}
        self.error_counts = {}
        self.slow_calls = {}  # Calls over 5 seconds

    def record_call(self, operation: str, duration: float, success: bool):
        """Record an API call for metrics."""
        if operation not in self.call_counts:
            self.call_counts[operation] = 0
            self.total_durations[operation] = 0
            self.error_counts[operation] = 0
            self.slow_calls[operation] = 0

        self.call_counts[operation] += 1
        self.total_durations[operation] += duration

        if not success:
            self.error_counts[operation] += 1

        if duration > 5:
            self.slow_calls[operation] += 1

    def get_stats(self, operation: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics for API calls."""
        if operation:
            if operation not in self.call_counts:
                return {"error": "No data for operation"}

            count = self.call_counts[operation]
            return {
                "operation": operation,
                "total_calls": count,
                "total_duration": self.total_durations[operation],
                "average_duration": self.total_durations[operation] / count if count > 0 else 0,
                "error_count": self.error_counts[operation],
                "error_rate": self.error_counts[operation] / count if count > 0 else 0,
                "slow_calls": self.slow_calls[operation],
            }

        # Return stats for all operations
        stats = {}
        for op in self.call_counts:
            stats[op] = self.get_stats(op)
        return stats

    def log_summary(self):
        """Log a summary of API metrics."""
        stats = self.get_stats()

        if not stats:
            return

        summary_lines = ["API Call Summary:"]
        for op, data in stats.items():
            summary_lines.append(
                f"  {op}: {data['total_calls']} calls, "
                f"avg {data['average_duration']:.2f}s, "
                f"{data['error_count']} errors, "
                f"{data['slow_calls']} slow"
            )

        api_logger.info("\n".join(summary_lines))


# Global metrics instance
metrics = APIMetrics()


def get_api_metrics() -> Dict[str, Any]:
    """Get current API metrics."""
    return metrics.get_stats()


def analyze_api_logs(hours: int = 24) -> Dict[str, Any]:
    """Analyze API logs for the last N hours."""
    from datetime import datetime, timedelta

    cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    stats = {
        "total_calls": 0,
        "failed_calls": 0,
        "slow_calls": 0,
        "operations": {},
        "users": {},
        "errors": [],
    }

    # Read log file
    if api_log_file.exists():
        with open(api_log_file, "r") as f:
            for line in f:
                try:
                    log_entry = json.loads(line)
                    timestamp = datetime.fromisoformat(log_entry["timestamp"])

                    if timestamp < cutoff_time:
                        continue

                    if "api_data" not in log_entry:
                        continue

                    api_data = log_entry["api_data"]
                    operation = api_data.get("operation", "unknown")

                    stats["total_calls"] += 1

                    if not api_data.get("success", True):
                        stats["failed_calls"] += 1
                        error_info = {
                            "timestamp": timestamp.isoformat(),
                            "operation": operation,
                            "error": api_data.get("error", {})
                        }
                        stats["errors"].append(error_info)

                    if api_data.get("duration_seconds", 0) > 5:
                        stats["slow_calls"] += 1

                    # Track by operation
                    if operation not in stats["operations"]:
                        stats["operations"][operation] = {
                            "count": 0,
                            "total_duration": 0,
                            "errors": 0
                        }
                    stats["operations"][operation]["count"] += 1
                    stats["operations"][operation]["total_duration"] += api_data.get("duration_seconds", 0)
                    if not api_data.get("success", True):
                        stats["operations"][operation]["errors"] += 1

                    # Track by user
                    user_id = api_data.get("user_id")
                    if user_id:
                        if user_id not in stats["users"]:
                            stats["users"][user_id] = {
                                "count": 0,
                                "total_duration": 0
                            }
                        stats["users"][user_id]["count"] += 1
                        stats["users"][user_id]["total_duration"] += api_data.get("duration_seconds", 0)

                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    api_logger.debug(f"Error analyzing log line: {e}")

    # Calculate averages
    for op_data in stats["operations"].values():
        if op_data["count"] > 0:
            op_data["average_duration"] = op_data["total_duration"] / op_data["count"]

    for user_data in stats["users"].values():
        if user_data["count"] > 0:
            user_data["average_duration"] = user_data["total_duration"] / user_data["count"]

    return stats