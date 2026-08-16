# Rainbow Tail prototype

依存関係のない Canvas ゲームです。ES Modulesを使用しているため、ローカルHTTPサーバーから`index.html`を開いてください。

`index.js`がCanvas生成と初回実行を担当し、ゲーム処理は`src`フォルダ内に機能別で分割しています。

## ビルド

```sh
npm install
npm run build
```

productionビルドではwebpackがJavaScriptをminifyし、提出用ファイル一式を`dist`フォルダへ出力します。ビルド完了時に`dist`の合計バイト数も表示されます。

- `←` / `→` または `A` / `D`: 旋回
- スマートフォンでは画面の左半分 / 右半分をタッチ: 旋回
- `Space` / `Enter` または画面タップ: ゲームオーバー後にリスタート

虹が過去の軌跡と交差して輪を作った際、その内側に灰色の雲があれば取得して虹を消費します。雲のない輪、画面左右外への移動はゲームオーバーです。
