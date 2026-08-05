// Initialize EmailJS
emailjs.init("mzwaLKkRmeJAU0wGG");

function sendOrderConfirmation(order) {
  emailjs.send(
    "service_afos11r",
    "template_07ojt1i",
    {
      customer_name: order.customer_name,
      order_id: order.order_id,
      items: order.items,
      total_price: order.total_price,
      status: order.status,
      tracking_link: order.tracking_link
    }
  )
  .then(function(response) {
    console.log("Email sent successfully", response);
  })
  .catch(function(error) {
    console.error("Email sending failed", error);
  });
}
