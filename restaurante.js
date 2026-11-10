const urlAPI = 'https://xwngmws6z9.execute-api.us-east-1.amazonaws.com/pedidos';


function changeQty(id, delta){
  const el = document.getElementById('qty-' + id);
  let qty = parseInt(el.textContent, 10) + delta;
  if(qty < 1) qty = 1;
  el.textContent = qty;
  const base = parseFloat(document.getElementById('card-' + id).dataset.price);
  document.getElementById('price-' + id).textContent = '$' + (base * qty).toFixed(2);
}

async function orderItem(id, name){
  const btn = document.getElementById('btn-' + id);
  const qty = document.getElementById('qty-' + id).textContent;
  const basePrice = parseFloat(document.getElementById('card-' + id).dataset.price);
  
  const cantidad = parseInt(qty, 10);
  const precioTotal = basePrice * cantidad;

  const original = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  const pedido = {
    pid: Date.now().toString(),
    cliente: "Mesa de Prueba", 
    hora: new Date().toLocaleTimeString(),
    estado: "pendiente",
    items: [
      { nombre: name, cantidad: cantidad, precio: basePrice }
    ],
    total: precioTotal
  };

  try {
    const respuesta = await fetch(urlAPI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    });

    if (respuesta.ok) {
      btn.textContent = 'Agregado ✓ (' + cantidad + ')';
      btn.classList.add('added');
    } else {
      btn.textContent = 'Error en pedido';
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    btn.textContent = 'Sin conexión';
  }

  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('added');
    btn.disabled = false;
  }, 1400);
}

async function cargarPedidos() {
  try {
    const respuesta = await fetch(urlAPI);
    const pedidos = await respuesta.json();

    const lista = document.getElementById('orders-list');
    if (!lista) return; 

    lista.innerHTML = ''; 

    if (pedidos.length === 0) {
      lista.innerHTML = `
        <div class="empty-state" id="empty-state">
          <span class="emoji">🧾</span>
          <p>Aún no hay pedidos pendientes.<br>En cuanto un cliente oprima "Ordenar", aparecerá aquí.</p>
        </div>`;
      return;
    }

    pedidos.forEach(pedido => addOrder(pedido));
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
  }
}

function addOrder(order){
  const itemsHtml = order.items.map(it => `
    <li>
      <span><span class="qty">${it.cantidad}x</span>${it.nombre}</span>
      <span>$${(it.precio * it.cantidad).toFixed(2)}</span>
    </li>
  `).join('');

  const card = document.createElement('div');
  card.className = 'order-card';
  card.id = `pedido-${order.pid}`; 

  card.innerHTML = `
    <div class="order-top">
      <div>
        <div class="order-id">Pedido #${order.pid.slice(-4)}</div>
        <div class="order-meta">${order.cliente} · ${order.hora}</div>
      </div>
      <button class="status-badge" style="cursor:pointer; border:none;" onclick="marcarListo('${order.pid}')">PENDIENTE ✓</button>
    </div>
    <ul class="order-items">${itemsHtml}</ul>
    <div class="order-total">
      <span>Total</span>
      <span>$${order.total.toFixed(2)}</span>
    </div>
  `;
  document.getElementById('orders-list').prepend(card);
}

async function marcarListo(pid) {
  const btn = document.querySelector(`#pedido-${pid} .status-badge`);
  btn.textContent = 'ACTUALIZANDO...';
  btn.disabled = true;

  try {
    const respuesta = await fetch(urlAPI, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid: pid }) 
    });

    if (respuesta.ok) {
      const card = document.getElementById(`pedido-${pid}`);
      card.remove();
      
      if (document.getElementById('orders-list').children.length === 0) {
         cargarPedidos(); 
      }
    } else {
      btn.textContent = 'ERROR';
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    btn.textContent = 'ERROR';
    btn.disabled = false;
  }
}


if (document.getElementById('orders-list')) {
  cargarPedidos(); 
  setInterval(cargarPedidos, 8000); 
}