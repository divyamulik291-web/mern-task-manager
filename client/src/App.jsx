
import { useCallback, useEffect, useState } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  
const loadTasks = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/tasks");
    const data = response.data;

    // Accept common backend response formats
    const taskList = Array.isArray(data)
      ? data
      : Array.isArray(data?.tasks)
        ? data.tasks
        : Array.isArray(data?.data)
          ? data.data
          : null;

    if (!taskList) {
      console.error("Unexpected GET /tasks response:", data);
      throw new Error(
        "The server did not return a task list. Check the backend API response."
      );
    }

    setTasks(taskList);
  } catch (err) {
    console.error("Load tasks error:", err);

    setError(
      err.response?.data?.message ||
      err.message ||
      "Unable to load tasks."
    );
  } finally {
    setLoading(false);
  }
}, []);

  // Add a new task or update an existing task
  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const taskData = {
        title: title.trim(),
        description: description.trim()
      };

      if (editingId) {
        await api.put(`/tasks/${editingId}`, taskData);
      } else {
        await api.post("/tasks", taskData);
      }

      resetForm();
      await loadTasks();
    } catch (err) {
      console.error("Save task error:", err);
      setError(
        err.response?.data?.message || "Unable to save task."
      );
    } finally {
      setSaving(false);
    }
  }

  // Load a task into the form for editing
  function startEditing(task) {
    setTitle(task.title || "");
    setDescription(task.description || "");
    setEditingId(task._id);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Mark a task as completed or pending
  async function toggleTask(task) {
    try {
      setError("");

      await api.put(`/tasks/${task._id}`, {
        completed: !task.completed
      });

      await loadTasks();
    } catch (err) {
      console.error("Update task error:", err);
      setError(
        err.response?.data?.message || "Unable to update task."
      );
    }
  }

  // Delete a task
  async function deleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/tasks/${id}`);

      if (editingId === id) {
        resetForm();
      }

      await loadTasks();
    } catch (err) {
      console.error("Delete task error:", err);
      setError(
        err.response?.data?.message || "Unable to delete task."
      );
    }
  }

  // Filtering is safe because tasks is always an array
  const visibleTasks = tasks.filter((task) => {
    if (filter === "completed") return Boolean(task.completed);
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter(
    (task) => Boolean(task.completed)
  ).length;

  const pendingCount = tasks.length - completedCount;

  return (
    <main className="page">
      <section className="dashboard">
        <header className="hero">
          <p className="eyebrow">MERN STACK PROJECT</p>
          <h1>My Task Manager</h1>
          <p>
            Plan your work. Track your progress. Get things done.
          </p>
        </header>

        <section className="stats">
          <article className="stat-card">
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </article>

          <article className="stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>

          <article className="stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </article>
        </section>

        <section className="panel">
          <h2>{editingId ? "Edit Task" : "Add a New Task"}</h2>

          <form onSubmit={handleSubmit} className="task-form">
            <label htmlFor="title">Task Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Complete React assignment"
              maxLength={120}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Add task details..."
              maxLength={1000}
              rows={3}
            />

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Task"
                    : "Add Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <section className="panel">
          <div className="list-header">
            <h2>Your Tasks</h2>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter tasks"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <p className="empty">Loading tasks...</p>
          ) : visibleTasks.length === 0 ? (
            <p className="empty">
              No tasks found. Add your first task!
            </p>
          ) : (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <article className="task-item" key={task._id}>
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} as completed`}
                  />

                  <div className="task-content">
                    <h3 className={task.completed ? "done" : ""}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <span
                      className={
                        task.completed
                          ? "status done-status"
                          : "status"
                      }
                    >
                      {task.completed ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => startEditing(task)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteTask(task._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer>
          Full Stack Development Lab | React + Express + MongoDB
        </footer>
      </section>
    </main>
  );
}

export default App;
