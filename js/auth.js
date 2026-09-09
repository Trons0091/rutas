

const Auth = {
  getUsers() {
    return Store.get("ta_users", []);
  },
  saveUsers(users) {
    Store.set("ta_users", users);
  },
  getCurrentUser() {
    return Store.get("ta_session", null);
  },
  setCurrentUser(user) {
    Store.set("ta_session", user);
  },
  logout() {
    localStorage.removeItem("ta_session");
  },
  register(name, email, password) {
    const users = this.getUsers();
    if (users.find((u) => u.email === email)) {
      return { ok: false, error: "Ya existe una cuenta con ese correo." };
    }
    const user = {
      id: "u" + Date.now(),
      name,
      email,
      password, // debo recordar no guardar contraseñas
      avatar: name.trim().charAt(0).toUpperCase() || "U",
      interests: [],
      favorites: [],
      visited: [],
      activities: [],
      prefs: {}, // 
    };
    users.push(user);
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { ok: true, user };
  },
  login(email, password) {
    const users = this.getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return { ok: false, error: "Correo o contraseña incorrectos." };
    this.setCurrentUser(user);
    return { ok: true, user };
  },
  updateCurrentUser(patch) {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.setCurrentUser(updated);
    const users = this.getUsers().map((u) => (u.id === updated.id ? updated : u));
    this.saveUsers(users);
    return updated;
  },
};
