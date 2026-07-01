export async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error('Ошибка загрузки');
  return r.json();
}