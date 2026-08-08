// js/checkout.js

(function(){

function $(id){
    return document.getElementById(id);
}


function formatCurrency(value){
    return "$" + Number(value || 0).toFixed(2);
}


function loadCart(){

    try{
        return JSON.parse(localStorage.getItem("cart") || "[]");
    }
    catch(e){
        return [];
    }

}


// ==========================
// RENDER CART + SUMMARY
// ==========================

function renderCart(){

    const checkoutItems = $("checkout-items");
    const summaryItems = $("summary-items");

    const subtotalEl = $("checkout-subtotal") || $("summary-subtotal");
    const shippingEl = $("checkout-shipping") || $("summary-shipping");
    const totalEl = $("checkout-total") || $("summary-total");

    const itemCount = $("item-count");


    const cart = loadCart();


    if(checkoutItems)
        checkoutItems.innerHTML="";


    if(summaryItems)
        summaryItems.innerHTML="";


    let subtotal = 0;
    let quantityTotal = 0;



    if(cart.length === 0){

        if(checkoutItems)
            checkoutItems.innerHTML="Your cart is empty";

        if(summaryItems)
            summaryItems.innerHTML="Your cart is empty";

    }



    cart.forEach(product=>{


        const name =
        product.name ||
        product.title ||
        "Product";


        const qty =
        Number(product.quantity || product.qty || 1);


        const price =
        Number(product.price || 0);



        const lineTotal = price * qty;


        subtotal += lineTotal;
        quantityTotal += qty;



        const itemHTML = `

        <div class="order-item">

        <img class="order-img"
        src="${product.image || 'images/product-placeholder.png'}"
        alt="${name}">


        <div class="order-item-info">

        <div class="order-item-name">
        ${name}
        </div>


        <div class="order-item-variant">
        ${product.variant || ""}
        </div>


        <span class="order-item-qty">
        Qty: ${qty}
        </span>


        </div>


        <div class="order-item-price">
        ${formatCurrency(lineTotal)}
        </div>


        </div>

        `;



        if(summaryItems)
            summaryItems.innerHTML += itemHTML;


        if(checkoutItems)
            checkoutItems.innerHTML += itemHTML;


    });



    const shipping = subtotal > 0 ? 0 : 0;


    const total = subtotal + shipping;



    if(subtotalEl)
        subtotalEl.textContent=formatCurrency(subtotal);


    if(shippingEl)
        shippingEl.textContent=formatCurrency(shipping);


    if(totalEl)
        totalEl.textContent=formatCurrency(total);



    if(itemCount)
        itemCount.textContent=quantityTotal;



    return {
        cart,
        subtotal,
        shipping,
        total
    };

}


// ==========================
// ORDER ID
// ==========================


function generateOrderID(){

const chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


let first="";

let second="";


for(let i=0;i<10;i++){

first += chars[
Math.floor(Math.random()*chars.length)
];

}


for(let i=0;i<2;i++){

second += chars[
Math.floor(Math.random()*chars.length)
];

}


return `GK-${first}-${second}`;

}

 // ==========================
// SAVE LOCAL ORDER
// ==========================

function saveLocalOrder(order){

    try{

        let orders =
        JSON.parse(localStorage.getItem("orders") || "[]");


        orders.push(order);


        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );

    }
    catch(error){

        console.log(
        "Local order save failed",
        error
        );

    }

}



// ==========================
// ERROR HANDLING
// ==========================

function showError(message){

const box=$("error-message");

if(box){

box.style.display="block";

box.textContent=message;

}

}



function clearError(){

const box=$("error-message");

if(box){

box.style.display="none";

box.textContent="";

}

}



// ==========================
// TRACK ORDER
// ==========================

async function trackOrder(orderID){

const result=$("order-tracking-result");


if(!result)
return;



result.innerHTML="Checking order...";



try{


if(window.supabaseClient){


const {data,error}=await window.supabaseClient

.from("orders")

.select("*")

.eq("order_id",orderID)

.single();



if(error){

result.innerHTML="Order not found.";

return;

}



result.innerHTML=`

<b>Order ID:</b> ${data.order_id}<br>

<b>Status:</b> ${data.status}<br>

<b>Total:</b> ${formatCurrency(data.total)}

`;



}else{


result.innerHTML=
"Tracking unavailable.";

}



}

catch(e){

result.innerHTML=
"Tracking error.";

}


}



// ==========================
// PAGE START
// ==========================


document.addEventListener(
"DOMContentLoaded",
()=>{


renderCart();



// Track button

const trackBtn=$("track-btn");


if(trackBtn){

trackBtn.addEventListener(
"click",
()=>{


const id=$("track-order-id").value.trim();


if(!id){

showError(
"Enter your Order ID"
);

return;

}


trackOrder(id);



});

}




const form=$("checkout-form");


if(!form)
return;



form.addEventListener(
"submit",
async(e)=>{


e.preventDefault();


clearError();



const customer={

name:$("fullName").value.trim(),

email:$("email").value.trim(),

phone:$("phone").value.trim(),

country:$("country").value,

city:$("city").value.trim(),

address:$("address").value.trim(),

zip:$("postalCode").value.trim(),

notes:$("orderNotes") ?
$("orderNotes").value.trim()
:
""

};





if(!customer.name)
return showError("Enter your full name");


if(!customer.email)
return showError("Enter your email");


if(!customer.phone)
return showError("Enter phone number");


if(!customer.country)
return showError("Select country");


if(!customer.city)
return showError("Enter city");


if(!customer.address)
return showError("Enter address");





const cartData=renderCart();



if(cartData.cart.length===0)

return showError(
"Your cart is empty"
);





const orderID=generateOrderID();



const order={


order_id:orderID,


customer_name:
customer.name,


email:
customer.email,


phone:
customer.phone,


country:
customer.country,


city:
customer.city,


address:
customer.address,


zip_code:
customer.zip,


products:
cartData.cart,


subtotal:
cartData.subtotal,


shipping:
cartData.shipping,


total:
cartData.total,


status:
"Processing",


created_at:
new Date().toISOString()


};




// Show immediately

const display=$("order-id-display");


if(display){

display.innerHTML=
`
Order placed successfully!<br>
Order ID:
<strong>${orderID}</strong>
`;

}




// Save locally first

saveLocalOrder(order);




// Save Supabase

try{


if(window.supabaseClient){


const {error}=await window.supabaseClient

.from("orders")

.insert([order]);



if(error){

console.log(
"Supabase error:",
error
);

}



}



}

catch(error){

console.log(
"Database error:",
error
);

}




// Email confirmation

if(typeof sendOrderConfirmation==="function"){


try{


sendOrderConfirmation({

customer_name:
customer.name,

order_id:
orderID,

items:
cartData.cart,

total_price:
cartData.total,

status:
"Processing"

});


}

catch(e){

console.log(
"Email failed",
e
);

}


}





// Clear cart

localStorage.removeItem(
"cart"
);



renderCart();



}

);


});


})();
