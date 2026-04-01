const form = document.getElementById("registroForm");

form.addEventListener("submit", function(e){
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if(password !== confirm){
    alert("Las contraseñas no coinciden");
    return;
  }

  alert("Registro exitoso ✅");
  form.reset();
});