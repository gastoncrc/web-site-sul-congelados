import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderEmail = async (orderData: any, items: any[]) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.product.isPromo ? item.product.promoPrice : item.product.unitPrice).toLocaleString('es-AR')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) * item.quantity).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"SUL Congelados" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Nuevo Pedido: ${orderData.customerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #003366; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">SUL Congelados</h1>
          <p style="margin: 5px 0 0 0;">Nuevo Pedido Recibido</p>
        </div>
        <div style="padding: 20px;">
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
    `,
  };

  return transporter.sendMail(mailOptions);
};
