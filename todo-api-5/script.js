// State: Array of tasks
let tasks = [];  // Empty array - tasks will be loaded from API

// Get references to DOM elements
const newTaskInput = document.getElementById('new-task-input');
const notCompletedTaskList = document.querySelector('.not-completed-tasks .task-list');
const completedTaskList = document.querySelector('.completed-tasks .task-list');
const API_BASE_URL = 'https://dummyjson.com';
const USER_ID = 1;

// Form submit handler
document.querySelector('#add-task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addTask();
});

// Add a new task to state
function addTask() {
    const taskText = newTaskInput.value.trim();

    // Add task to state
    tasks.push({
        id: crypto.randomUUID(),
        text: taskText,
        completed: false
    });

    // Clear input and re-render
    newTaskInput.value = '';
    newTaskInput.focus();
    render();
}

// Delete a task from state
function deleteTask(e) {
    const taskElement = e.target.closest('.task');
    const taskId = taskElement.dataset.id;
    
    tasks = tasks.filter(task => task.id !== taskId);
    render();
}

// Mark a task as completed
function completeTask(e) {
    const taskElement = e.target.closest('.task');
    const taskId = taskElement.dataset.id;
    
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = true;
    }
    render();
}

// Restore a task to not completed
function restoreTask(e) {
    const taskElement = e.target.closest('.task');
    const taskId = taskElement.dataset.id;
    
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = false;
    }
    
    render();
}

// Create task element from task object
function createTaskElement(task) {
    // Clone the template
    const template = document.querySelector('.templates .task');
    const taskDiv = template.cloneNode(true);

    // Set task ID as data attribute
    taskDiv.dataset.id = task.id;

    // Update task text
    taskDiv.querySelector('p').textContent = task.text;

    return taskDiv;
}
async function loadTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        const data = await response.json();
        
        tasks = data.todos.map(todo => ({
            id: todo.id,
            text: todo.todo,        // 'todo' -> 'text'
            completed: todo.completed
        }));
        
        render();

    }
    }   

// Render all tasks to the DOM
function render() {
    // Clear both lists
    notCompletedTaskList.innerHTML = '';
    completedTaskList.innerHTML = '';

    // Render tasks based on their completion status
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        if (task.completed) {
            completedTaskList.appendChild(taskElement);
        } else {
            notCompletedTaskList.appendChild(taskElement);
        }
    });
}

render();