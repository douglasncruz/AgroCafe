"use server";

export async function sendContactEmail(formData: FormData) {
  const data: Record<string, any> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY || "YOUR_ACCESS_KEY";
  const source = data.form_source || "Contato Geral";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
        ...data,
        subject: `[${source}] Nova mensagem de ${data.name || 'Cliente'}`,
        from_name: "AgroCerradoCafé System",
      }),
    });

    const result = await response.json();
    if (result.success) {
      return { success: true };
    } else {
      console.error("Erro ao enviar email:", result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    return { success: false, error: "Erro de conexão" };
  }
}
