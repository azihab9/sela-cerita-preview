(() => {
  const config=window.SELA_SUPABASE_CONFIG||{};
  const ready=window.supabase&&config.url&&config.anonKey&&!config.url.includes("YOUR_")&&!config.anonKey.includes("YOUR_");
  const message=document.querySelector("#auth-message");
  const form=document.querySelector("#auth-form");
  const title=document.querySelector("#form-title");
  const subtitle=document.querySelector("#form-subtitle");
  const button=document.querySelector("#submit-button");
  const nameWrap=document.querySelector("#name-wrap");
  const password=document.querySelector("#password");
  const loginTab=document.querySelector("#login-tab");
  const signupTab=document.querySelector("#signup-tab");
  let mode="login";
  let client=null;
  if(ready) client=window.supabase.createClient(config.url,config.anonKey);
  else message.textContent="Koneksi akun belum disiapkan. Hubungkan project Supabase untuk mengaktifkan login dan pendaftaran.";
  function setMode(next){mode=next;const signup=mode==="signup";loginTab.classList.toggle("active",!signup);signupTab.classList.toggle("active",signup);nameWrap.hidden=!signup;title.innerHTML=signup?'Mulai <em>ceritamu.</em>':'Selamat datang <em>kembali.</em>';subtitle.textContent=signup?'Buat akun untuk menyimpan dan mengelola website-mu.':'Masuk untuk melanjutkan ceritamu.';button.textContent=signup?'Buat akun Sela Cerita ↗':'Masuk ke dashboard ↗';password.autocomplete=signup?'new-password':'current-password';message.textContent="";}
  loginTab.addEventListener("click",()=>setMode("login"));signupTab.addEventListener("click",()=>setMode("signup"));
  form.addEventListener("submit",async event=>{event.preventDefault();if(!client){message.textContent="Supabase belum terhubung. Lengkapi app/supabase-config.js terlebih dahulu.";return;}button.disabled=true;message.textContent="Sebentar, sedang memproses...";
    const email=document.querySelector("#email").value.trim();const pass=password.value;
    try{
      if(mode==="signup"){
        const displayName=document.querySelector("#display-name").value.trim();
        const {data,error}=await client.auth.signUp({email,password:pass,options:{data:{display_name:displayName},emailRedirectTo:location.origin+location.pathname.replace("auth.html","dashboard.html")}});
        if(error)throw error;
        if(data.session){location.href="dashboard.html";return;}
        message.textContent="Akun berhasil dibuat. Periksa email untuk konfirmasi, lalu masuk kembali.";
      }else{
        const {data,error}=await client.auth.signInWithPassword({email,password:pass});
        if(error)throw error;
        if(data.session){location.href="dashboard.html";return;}
      }
    }catch(error){message.textContent=error.message||"Terjadi kendala. Coba lagi.";}
    finally{button.disabled=false;}
  });
  document.querySelector("#year").textContent=new Date().getFullYear();
})();