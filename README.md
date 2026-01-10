
# 🎉 Eventify – Event Management & Service Booking Platform

Eventify is a full‑stack event management and service‑provider booking system built with **ASP.NET Core Web API**, **Entity Framework Core**, and a **React.js frontend**.  
It demonstrates strong skills in backend architecture, database design, authentication, role-based authorization, and clean API development.

---

## 🚀 Features

### ✅ **User Roles**
- **Admin** – Manages users, service categories, providers, disputes, and system data  
- **Service Provider** – Manages services, pricing, availability, portfolio  
- **Customer** – Creates events, books providers, writes reviews  

---

## 🔐 Authentication & Security
- **JWT Authentication**
- **Secure Password Hashing**
- **Role-Based Authorization**
- **Suspended user handling**
- **Soft delete system** (preventing accidental data loss)
- **Validation for all sensitive operations**

---

## 🗂️ Main Modules

### 📌 **1. Users & Profiles**
- Register / login
- Role assignment
- Suspend / Unsuspend users (Admin only)
- Profile management

### 📌 **2. Events**
Events include:
- Event Type  
- Date  
- Start & End Time  
- Full Address  
- Guest Count  
- Services Needed (linked to Service Categories)  

### 📌 **3. Service Categories**
- Admin can create / update / soft delete categories
- Cannot delete if active providers still use the category

### 📌 **4. Service Providers**
Each provider has:  
- Description  
- Phone Number  
- Location  
- Pricing Details  
- Portfolio Link  
- Service Category  

### 📌 **5. Bookings**
- Customers book service providers  
- Status workflow: *Pending → Confirmed → Completed / Cancelled*  
- Linked to payments and reviews  

### 📌 **6. Payments**
- Linked directly to bookings  
- Payment method  
- Payment date  
- Amount  

### 📌 **7. Reviews**
- Customers review service providers after events  
- Ratings + Comment  
- Helps ranking providers

### 📌 **8. Availability**
- Providers manage available dates  
- Customers can only book unbooked dates  

### 📌 **9. Notifications**
- Notifies users of important actions (bookings, updates, approvals)

### 📌 **10. Reports & Disputes**
Used to report:
- Events  
- Bookings  
- Users  
- Service Providers  

Admin receives and resolves them.

---

## 🏛️ Database Architecture (EF Core)
Includes:
- One-to-many: User → Events
- One-to-many: Providers → Bookings
- Many-to-many: Events ↔ ServiceCategories
- Soft Deletes for safety
- Restrictive delete behavior to prevent cascaded accidental deletion

A comprehensive `OnModelCreating` configuration ensures:
- Referential integrity  
- Clean relationships  
- Prevention of circular cascades  

---

## 🖥️ Tech Stack

### **Architecture**

    React Frontend → ASP.NET Core REST API → SQL Server Database

### **Backend**
- ASP.NET Core 8 Web API  
- Entity Framework Core  
- SQL Server Management Studio
- JWT Authentication  

### **Frontend**
- React Js
- Tailwind CSS  
- Axios API Integration  

### **Tools**
- Git & GitHub  
- Swagger API Docs  
- Postman  
- GitHub Desktop  

---

## 🏗️ Installation & Setup

### 1️⃣ Clone repository
```
git clone https://github.com/s225282372/EventifyApp.git
```


### 2️⃣ Navigate to API folder
```
cd EventifyAPI
```

### 3️⃣ Apply migrations
```
dotnet ef database update
```

### 4️⃣ Run the API
```
dotnet run
```

### 5️⃣ Frontend setup
```
cd eventify_frontend
npm install
npm start
```



