import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
    const { user, logout } = useContext(AuthContext);
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState({ title: "", content: "" });
    const [editing, setEditing] = useState(null);
    const [editTodo, setEditTodo] = useState({ title: "", content: "", completed: false });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const fetchTodos = async () => {
        setLoading(true);
        try {
            const res = await API.get("/todo/getAllTodos");
            setTodos(res.data.data || []);
        } catch (err) {
            if (err.response?.status === 404) {
                // No tasks yet is valid state
                setTodos([]);
            } else {
                console.error("Fetch todos error", err);
                alert(err.response?.data?.message || "Failed to fetch todos");
            }
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.title.trim()) return;
        try {
            await API.post("/todo/addTodo", newTodo);
            setNewTodo({ title: "", content: "" });
            fetchTodos();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add todo");
        }
    };

    const updateTodo = async (e) => {
        e.preventDefault();
        try {
            await API.post(`/todo/updateTodo/${editing}`, editTodo);
            setEditing(null);
            setEditTodo({ title: "", content: "", completed: false });
            fetchTodos();
        } catch (err) {
            alert("Failed to update todo");
        }
    };

    const deleteTodo = async (id) => {
        if (!confirm("Are you sure you want to delete this todo?")) return;
        try {
            await API.post(`/todo/deleteTodo/${id}`);
            fetchTodos();
        } catch (err) {
            alert("Failed to delete todo");
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = search.trim();
        setIsSearching(true);

        try {
            const res = await API.get("/todo/getAllTodos");
            const allTodos = res.data.data || [];

            if (!query) {
                setTodos(allTodos);
            } else {
                const filtered = allTodos.filter((todo) => {
                    const title = todo.title || "";
                    const content = todo.content || "";
                    return (
                        title.toLowerCase().includes(query.toLowerCase()) ||
                        content.toLowerCase().includes(query.toLowerCase())
                    );
                });
                setTodos(filtered);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setTodos([]);
            } else {
                console.error("Search todo error", err);
                alert(err.response?.data?.message || "Search failed");
            }
        } finally {
            setIsSearching(false);
        }
    };

    const startEdit = (todo) => {
        setEditing(todo._id);
        setEditTodo({ title: todo.title, content: todo.content, completed: todo.completed });
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-5xl">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Task-Manager</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Welcome, {user?.fullName}</span>
                        <button
                            onClick={logout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Task</h2>
                    <form onSubmit={addTodo} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Task Title"
                            value={newTodo.title}
                            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <textarea
                            placeholder="Task Description (optional)"
                            value={newTodo.content}
                            onChange={(e) => setNewTodo({ ...newTodo, content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition duration-200"
                        >
                            Add Task
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Search Tasks</h2>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                            type="text"
                            placeholder="Search by title or content..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition duration-200"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                fetchTodos();
                            }}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Clear
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Tasks</h2>
                    {isSearching ? (
                        <div className="text-center py-8 text-gray-600">Searching...</div>
                    ) : loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : todos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No tasks found. Add your first task!</div>
                    ) : (
                        <div className="space-y-4">
                            {todos.map((todo) => (
                                <div key={todo._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                                    {editing === todo._id ? (
                                        <form onSubmit={updateTodo} className="space-y-3">
                                            <input
                                                type="text"
                                                value={editTodo.title}
                                                onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                            <textarea
                                                value={editTodo.content}
                                                onChange={(e) => setEditTodo({ ...editTodo, content: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editTodo.completed}
                                                    onChange={(e) => setEditTodo({ ...editTodo, completed: e.target.checked })}
                                                />
                                                <span>Completed</span>
                                            </label>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="submit"
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition duration-200"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(null)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                    {todo.title}
                                                </h3>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => startEdit(todo)}
                                                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded transition duration-200"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTodo(todo._id)}
                                                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition duration-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            {todo.content && (
                                                <p className={`text-gray-600 mb-2 ${todo.completed ? 'line-through' : ''}`}>
                                                    {todo.content}
                                                </p>
                                            )}
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
                                                <span className={`px-2 py-1 rounded ${todo.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {todo.completed ? 'Completed' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
