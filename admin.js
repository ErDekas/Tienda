const API_URL = "https://api.escuelajs.co/api/v1";
let currentSection = "products";
let categories = [];

// DOM Elements
const tableBody = document.getElementById("tableBody");
const modal = document.getElementById("formModal");
const itemForm = document.getElementById("itemForm");
const addButton = document.getElementById("addButton");
const logout = document.getElementById("logoutButton");
const sectionTitle = document.querySelector(".section-title-admin");
const navItems = document.querySelectorAll(".nav-item-admin");

// Event Listeners
addButton.addEventListener("click", () => openModal());
itemForm.addEventListener("submit", handleSubmit);
navItems.forEach((item) => {
  item.addEventListener("click", () => changeSection(item.dataset.section));
});

function cerrarSesion() {
    sessionStorage.removeItem('usuarioActual');
    document.getElementById("admin").style.display = "none";
    document.getElementById("app").style.display = "block";
}

// Functions
async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/${currentSection}`);
    const data = await response.json();
    renderTable(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    categories = await response.json();
    const categorySelect = document.getElementById("category");
    categorySelect.innerHTML = categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

function renderTable(data) {
  tableBody.innerHTML = "";
  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.title || item.name || item.email}</td>
                    <td>${
                      item.price !== undefined ? `$${item.price}` : "-"
                    }</td>
                    <td>${item.category ? item.category.name : "-"}</td>
                    <td>
                        <button class="btn btn-primary" onclick="editItem(${
                          item.id
                        })">Editar</button>
                        <button class="btn btn-danger" onclick="deleteItem(${
                          item.id
                        })">Eliminar</button>
                    </td>
                `;
    tableBody.appendChild(row);
  });
}

function changeSection(section) {
  currentSection = section;
  sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === section);
  });
  fetchData();
}

function openModal(itemId = null) {
  modal.style.display = "block";
  if (!itemId) {
    itemForm.reset();
  }
}

function closeModal() {
  modal.style.display = "none";
  itemForm.reset();
}

async function handleSubmit(e) {
  e.preventDefault();
  const formData = {
    title: document.getElementById("title").value,
    price: parseInt(document.getElementById("price").value),
    description: document.getElementById("description").value,
    categoryId: parseInt(document.getElementById("category").value),
  };

  try {
    const response = await fetch(`${API_URL}/${currentSection}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      closeModal();
      fetchData();
    }
  } catch (error) {
    console.error("Error saving item:", error);
  }
}

async function deleteItem(id) {
  if (confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
    try {
      const response = await fetch(`${API_URL}/${currentSection}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
}

async function editItem(id) {
  try {
    const response = await fetch(`${API_URL}/${currentSection}/${id}`);
    const item = await response.json();

    document.getElementById("title").value = item.title || item.name || "";
    document.getElementById("price").value = item.price || "";
    document.getElementById("description").value = item.description || "";
    if (item.category) {
      document.getElementById("category").value = item.category.id;
    }

    openModal(id);
  } catch (error) {
    console.error("Error fetching item:", error);
  }
}

// Initial load
fetchCategories();
fetchData();
