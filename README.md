# The First Defense — Central Online Refeita

Versão refeita para corrigir o problema da foto.

## O que mudou

- A foto NÃO fica mais salva dentro do documento do Firestore.
- A foto vai para o Firebase Storage.
- O Firestore salva apenas a URL da foto.
- Isso evita travar o salvamento quando coloca imagem.

## Arquivos para subir no GitHub

Suba todos estes arquivos na raiz do repositório:

- index.html
- central.html
- painel.html
- style.css
- firebase-config.js
- login.js
- central.js
- firestore.rules
- storage.rules

## Atenção

Antes de testar foto, ative o Firebase Storage no Firebase Console.

Firebase > Build > Storage > Começar

Depois aplique as regras do arquivo storage.rules.
