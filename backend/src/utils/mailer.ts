import dotenv from 'dotenv';

dotenv.config();

// Resend vía su API HTTPS en vez de SMTP crudo — Render (como muchos PaaS) bloquea las
// conexiones salientes por el puerto SMTP (465/587), lo que dejaba este envío colgado
// indefinidamente sin nunca fallar ni resolver. La API HTTPS usa el puerto 443, que
// siempre está disponible. La misma API key que antes era la contraseña SMTP (EMAIL_PASS)
// es el Bearer token acá.
const sendViaResend = async (to: string, subject: string, html: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_PASS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `SUL Congelados <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorBody}`);
  }

  return response.json();
};

export const sendOrderEmail = async (orderData: any, items: any[]) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || '';

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.product.isPromo ? item.product.promoPrice : item.product.unitPrice).toLocaleString('es-AR')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) * item.quantity).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #003366; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">SUL Congelados</h1>
        <p style="margin: 5px 0 0 0;">Nuevo Pedido Recibido</p>
      </div>
      <div style="padding: 20px;">
        ${orderData.isGuest ? `
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
          <strong>⚠️ A CONFIRMAR</strong> — pedido de alguien sin cuenta registrada. No es un cliente conocido del sistema; confirmá los datos antes de despachar.
        </div>` : ''}
        <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">Datos del Cliente</h2>
        <p><strong>Nombre:</strong> ${orderData.customerName}</p>
        ${orderData.customerEmail ? `<p><strong>Email:</strong> ${orderData.customerEmail}</p>` : ''}
        <p><strong>Teléfono:</strong> ${orderData.customerPhone}</p>
        <p><strong>Tipo de Entrega:</strong> ${orderData.deliveryType}</p>
        <p><strong>Dirección/Planta:</strong> ${orderData.deliveryAddress}</p>
        ${orderData.deliveryDate ? `<p><strong>Fecha de Entrega:</strong> ${orderData.deliveryDate}</p>` : ''}
        <p><strong>Método de Pago:</strong> ${orderData.paymentMethod}</p>
        ${orderData.observations ? `<p><strong>Observaciones:</strong> ${orderData.observations}</p>` : ''}

        <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px;">Detalle del Pedido</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; text-align: left;">Producto</th>
              <th style="padding: 8px; text-align: center;">Cant.</th>
              <th style="padding: 8px; text-align: right;">Precio</th>
              <th style="padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 1.2em;">TOTAL:</td>
              <td style="padding: 15px 8px; text-align: right; font-weight: bold; font-size: 1.2em; color: #003366;">$${orderData.totalAmount.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Este es un mensaje automático generado por el sistema de SUL Congelados.
      </div>
    </div>
  `;

  const subjectPrefix = orderData.isGuest ? 'A CONFIRMAR — ' : '';
  return sendViaResend(adminEmail, `${subjectPrefix}Nuevo Pedido: ${orderData.customerName}`, html);
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #003366; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">SUL Congelados</h1>
        <p style="margin: 5px 0 0 0;">Restablecimiento de contraseña</p>
      </div>
      <div style="padding: 20px;">
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #003366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Elegir nueva contraseña</a>
        </p>
        <p style="font-size: 12px; color: #666;">Este enlace vence en 1 hora. Si no fuiste vos, ignorá este mensaje — tu contraseña actual sigue funcionando.</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Este es un mensaje automático generado por el sistema de SUL Congelados.
      </div>
    </div>
  `;

  return sendViaResend(to, 'Restablecer tu contraseña — SUL Congelados', html);
};
