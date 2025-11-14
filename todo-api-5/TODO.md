# TODO List - API Integrácia s DummyJSON

## Cieľ
Prepoj existujúcu TODO aplikáciu s fake REST API endpointom [DummyJSON](https://dummyjson.com/docs/todos) pre prácu s úlohami (todos).

---

## 📋 Pred začatím
- [ ] Prečítaj si dokumentáciu DummyJSON API: https://dummyjson.com/docs/todos
- [ ] Uisti sa, že rozumieš základom `fetch` API a `async/await` syntaxe
- [ ] Otestuj si API v prehliadači alebo Postman-e

---

## Krok 1: Pridaj API konfiguráciu
**Súbor:** `script.js`

- [ ] Na začiatok súboru pridaj konštanty:
  ```javascript
  const API_BASE_URL = 'https://dummyjson.com';
  const USER_ID = 1;
  ```
- [ ] Vymaž hardcoded úlohy z `tasks` array (nech je prázdne `[]`)

**Checkpoint:** Aplikácia by mala mať prázdne pole úloh

---

## Krok 2: Vytvor funkciu na načítanie úloh z API
**Súbor:** `script.js`

- [ ] Vytvor `async` funkciu `loadTodos()`
- [ ] Použij `fetch()` na GET požiadavku na endpoint: `${API_BASE_URL}/todos`
- [ ] Spracuj odpoveď pomocou `.json()`
- [ ] Odpoveď má štruktúru:
  ```json
  {
    "todos": [
      {
        "id": 1,
        "todo": "Do something nice...",
        "completed": true,
        "userId": 26
      }
    ],
    "total": 150,
    "skip": 0,
    "limit": 30
  }
  ```
- [ ] Preveď `data.todos` na náš formát pomocou `.map()`:
  ```javascript
  tasks = data.todos.map(todo => ({
      id: todo.id,
      text: todo.todo,        // 'todo' -> 'text'
      completed: todo.completed
  }));
  ```
- [ ] Zavolaj `render()` po načítaní dát
- [ ] Pridaj `try-catch` blok pre ošetrenie chýb

**Checkpoint:** V konzole by si mal vidieť načítané úlohy z API

---

## Krok 3: Uprav inicializáciu aplikácie
**Súbor:** `script.js`

  ```
- [ ] Pridaj:
  ```javascript
  loadTodos();
  ```

**Checkpoint:** Po načítaní stránky by si mal vidieť úlohy z API

---

## Krok 4: Prepoj pridávanie úlohy (CREATE)
**Súbor:** `script.js`, funkcia `addTask()`

- [ ] Zmeň funkciu na `async function addTask()`
- [ ] Na začiatku funkcie pridaj kontrolu prázdneho inputu:
  ```javascript
  if (!taskText) return;
  ```
- [ ] Obal kód do `try-catch` bloku
- [ ] Vytvor POST požiadavku na `${API_BASE_URL}/todos/add`:
  ```javascript
  const response = await fetch(`${API_BASE_URL}/todos/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          todo: taskText,
          completed: false,
          userId: USER_ID
      })
  });
  ```
- [ ] Získaj odpoveď: `const newTodo = await response.json();`
- [ ] API vráti nový todo objekt s `id`
- [ ] Pridaj novú úlohu do `tasks` array vo formáte aplikácie
- [ ] V `catch` bloku zobraz `alert()` s chybovou hláškou

**Checkpoint:** Po pridaní úlohy by sa mala zobraziť v zozname

---

## Krok 5: Prepoj mazanie úlohy (DELETE)
**Súbor:** `script.js`, funkcia `deleteTask(e)`

- [ ] Zmeň funkciu na `async function deleteTask(e)`
- [ ] Obal existujúci kód do `try-catch` bloku
- [ ] Pred filtrom `tasks` array pridaj DELETE požiadavku:
  ```javascript
  await fetch(`${API_BASE_URL}/todos/${taskId}`, {
      method: 'DELETE'
  });
  ```
- [ ] Pozor: porovnávaj `task.id != taskId` (nie `!==`) lebo ID z API je number, z data atribútu je string
- [ ] Pridaj error handling v `catch` bloku

**Checkpoint:** Mazanie úlohy by malo fungovať

---

## Krok 6: Prepoj označenie ako dokončené (UPDATE)
**Súbor:** `script.js`, funkcia `completeTask(e)`

- [ ] Zmeň funkciu na `async function completeTask(e)`
- [ ] Použij `==` namiesto `===` pri hľadaní úlohy (kvôli type coercion)
- [ ] Pridaj check: `if (!task) return;`
- [ ] Obal kód do `try-catch` bloku
- [ ] Pred zmenou `task.completed` pošli PATCH požiadavku:
  ```javascript
  await fetch(`${API_BASE_URL}/todos/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          completed: true
      })
  });
  ```
- [ ] Pridaj error handling

**Checkpoint:** Označenie úlohy ako hotovej by malo fungovať

---

## Krok 7: Prepoj obnovenie úlohy (UPDATE)
**Súbor:** `script.js`, funkcia `restoreTask(e)`

- [ ] Zmeň funkciu na `async function restoreTask(e)`
- [ ] Rovnaké úpravy ako v kroku 6, ale nastavíš `completed: false`
- [ ] Nezabudni na `try-catch` a error handling

**Checkpoint:** Obnovenie úlohy späť do "nedokončených" by malo fungovať

---

## 🎯 Finálne testovanie

- [ ] Otvor aplikáciu v prehliadači
- [ ] Načítajú sa úlohy z API?
- [ ] Funguje pridávanie novej úlohy?
- [ ] Funguje označenie ako dokončené?
- [ ] Funguje obnovenie úlohy?
- [ ] Funguje mazanie úlohy?
- [ ] Otvori DevTools → Network tab a over, že sa volajú správne API endpointy

---

## 💡 Bonusové úlohy (voliteľné)

- [ ] Pridaj loading spinner pri načítavaní dát z API
- [ ] Pridaj toast notifikácie namiesto `alert()` pri chybách
- [ ] Pridaj možnosť filtrovania (všetky/dokončené/nedokončené)
- [ ] Pridaj možnosť vyhľadávania v úlohách

---

## 📚 Užitočné zdroje

- [DummyJSON Todos API dokumentácia](https://dummyjson.com/docs/todos)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN - Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

---

## ⚠️ Dôležité poznámky

1. **DummyJSON neuchováva dáta** - všetky POST/PUT/PATCH/DELETE operácie sú len simulované. 

2. **Type coercion** - ID z API je `number`, ale z HTML data atribútu je `string`. Používaj `==` namiesto `===` alebo konvertuj typy.

3. **Error handling** - vždy ošetruj chyby v `try-catch` blokoch a daj užívateľovi vedieť, čo sa stalo.

4. **Async/Await** - všetky funkcie pracujúce s API musia byť `async` a používať `await` pri fetch operáciách.

