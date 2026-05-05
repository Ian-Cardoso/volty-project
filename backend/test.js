import nodemailer from 'nodemailer';

console.log("Iniciando teste...");

async function testarSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "ian8975c@gmail.com",
        pass: "nvxwxvkgiyqwdvjs"
      }
    });

    await transporter.verify();

    console.log("SMTP OK");

  } catch (err) {
    console.log("ERRO:", err);
  }
}

testarSMTP(); 