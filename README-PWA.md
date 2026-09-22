# TorneiosMVP — versão PWA

Este projeto reúne os torneios de xadrez, dama, cubo mágico e Torre de Hanoi em
um único aplicativo web instalável.

## Executar durante o desenvolvimento

```bash
npm install
npm run dev
```

## Gerar a versão final

```bash
npm run build
npm run preview
```

A pasta `dist` criada por `npm run build` contém a versão pronta para
publicação.

Com a configuração atual do GitHub Pages, a prévia local será aberta em:

```text
http://localhost:4173/TorneiosMVP/
```

## Publicação automática no GitHub Pages

O arquivo `.github/workflows/deploy-pages.yml` publica o aplicativo sempre que
uma atualização chega à branch `main`. No GitHub, a origem do Pages deve ficar
configurada como **GitHub Actions**.

Endereço esperado depois da primeira publicação:

```text
https://bluequation.github.io/TorneiosMVP/
```

## Instalar como aplicativo

Depois que a versão final estiver publicada em HTTPS, abra o endereço no
navegador. Quando a instalação estiver disponível, a tela inicial mostrará o
botão **Instalar aplicativo**. O navegador também pode oferecer a opção no menu
de instalação.

No iPhone ou iPad, use **Compartilhar → Adicionar à Tela de Início**.

## Dados e funcionamento offline

- Cada modalidade mantém seus próprios dados no armazenamento local do
  navegador.
- Fechar e reabrir o aplicativo preserva os torneios naquele dispositivo.
- O aplicativo funciona offline depois do primeiro carregamento completo.
- PWA não sincroniza automaticamente dados entre dispositivos.
- Use a exportação em JSON de cada torneio como cópia de segurança.
