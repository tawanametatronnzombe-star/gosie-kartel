/**
 * Gosie Kartel — Unified Payment Gateway v3
 * Single File Payment Handler
 *
 * Handles:
 * - Order creation
 * - Supabase Orders tracking
 * - Payment redirects
 * - Payment completion updates
 */

(function () {

"use strict";


const SUPABASE_URL =
"https://tnlktzagziuwjjzgrrna.supabase.co";


const SUPABASE_ANON_KEY =
"YOUR_SUPABASE_ANON_KEY";


const supabaseClient =
window.supabase
?
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
)
:
null;



const BASE_URL =
"https://tawanametatronnzombe-star.github.io/gosie-kartel";


const SUCCESS_URL =
`${BASE_URL}/order-success.html`;


const CANCEL_URL =
`${BASE_URL}/checkout.html`;





function generateOrderID(){

const chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

let code="";


for(let i=0;i<10;i++){

code += chars.charAt(
Math.floor(Math.random()*chars.length)
);

}


const number =
Math.floor(10+Math.random()*90);


return `GK-${code}-${number}`;

}





function getCart(){

try{

return JSON.parse(
localStorage.getItem("cart") || "[]"
);

}
catch{

return [];

}

}





function calculateTotal(cart){

let total=0;


cart.forEach(item=>{

const qty =
Number(
item.quantity ||
item.qty ||
1
);


const price =
Number(
item.price ||
0
);


total += qty * price;


});


return total;

}







async function createOrder(customer,provider){


const cart =
getCart();



if(cart.length===0){

throw new Error(
"Cart is empty"
);

}



const orderID =
generateOrderID();



const total =
calculateTotal(cart);



const order = {


order_id:
orderID,


customer_name:
customer.name,


email:
customer.email,


phone:
customer.phone,


address:
customer.address,


country:
customer.country,


zip_code:
customer.zip || null,


products:
cart,


total:
total,


status:
"Awaiting Payment",


tracking_number:
null,


carrier:
null,


pod_order_id:
null,


created_at:
new Date().toISOString()

};




if(supabaseClient){


const {error}=

await supabaseClient

.from('"Orders"')

.insert([order]);



if(error){

console.error(
"Order error:",
error.message
);

}


}



return {

orderID,

total

};


}







async function executePaymentRedirect(
customer,
provider
){


const order =
await createOrder(
customer,
provider
);



const success =
encodeURIComponent(
`${SUCCESS_URL}?order_id=${order.orderID}`
);



const cancel =
encodeURIComponent(
CANCEL_URL
);



let paymentURL;



switch(provider){



case "paynow":


paymentURL =

`https://www.paynow.co.zw/Payment/BillPaymentLink/?amount=${order.total}&reference=${order.orderID}&returnurl=${success}`;


break;




case "flutterwave":


paymentURL =

`https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${order.orderID}&amount=${order.total}&currency=USD&redirect_url=${success}&customer_email=${encodeURIComponent(customer.email)}`;


break;




case "dpo":


default:


paymentURL =

`https://secure.3gdirectpay.com/payv3.asp?id=${order.orderID}&amount=${order.total}&returnurl=${success}&backurl=${cancel}`;


break;


}



window.location.href =
paymentURL;


}







async function confirmPayment(orderID){


if(!supabaseClient)
return;



const {error}=

await supabaseClient

.from('"Orders"')

.update({

status:
"Paid"

})

.eq(

"order_id",

orderID

);



if(error){

console.warn(
"Payment confirmation error:",
error.message
);

}



localStorage.removeItem(
"cart"
);


}







window.GosiePaymentGateway = {


executePaymentRedirect,

confirmPayment,

generateOrderID,

calculateTotal

};



})();
