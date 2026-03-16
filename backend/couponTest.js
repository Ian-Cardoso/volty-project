
async function test(code) {
  const res = await fetch('http://localhost:3000/validate-coupon', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ code, orderTotal: 100 })
  });
  const data = await res.json();
  console.log(code, res.status, data);
}

(async()=>{
  await test('INDEFINIDO');
  await test('indefinido');
})();
