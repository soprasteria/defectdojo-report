# _DefectDojo to Orange Security Debt Format_

Outil permettant d'exporter la dette sécurité au format Orange depuis DefectDojo

## Utilisation

Installer Node.js >= 16 et NPM puis exécuter la commande suivante :

```bash
npx --package git+https://oauth2:$TOKEN@innersource.soprasteria.com/gael.girodon/dd-to-osdf.git \
  dd-to-osdf [options]
```

`dd-to-osdf --help` permet d'afficher le message d'aide.

Les options sont documentées ici : [`src/cli.js`](./src/cli.js#L34).

## Exemple

La commande suivante permet d'exporter la dette de sécurité associée au
produit `product-name` et à l'engagement `engagement-name` vers 2 fichiers
(`./secdebt.csv` et `./secdebt.html`) en incluant uniquement les vulnérabilités
actives et pas hors périmètre :

```bash
dd-to-osdf                                                 \
  --url "https://defectdojo.acme.corp:8080"                \
  --token "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"       \
  --product "product-name" --engagement "engagement-name"  \
  --statuses "active,!out_of_scope"                        \
  --output "./secdebt"     --formats "csv,html"
```
