# _DefectDojo to Orange Security Debt Format_

Outil permettant d'exporter la dette sécurité d'une application depuis
DefectDojo avec support de fonctionnalités additionnelles :

- Calcul de la criticité résultante à partir de l'impact (`severity`), de la
  facilité d'exploitation (définie via un _tag_) et d'une matrice de
  correspondance
- Gestion d'informations complémentaires définies via des _tags_ :
  - Origine de l'audit
  - Correction de la vulnérabilité à la charge du prestataire de service
- Génération de rapports personnalisables aux formats HTML, CSV et JSON
- Concaténation de la dette associée à plusieurs produits

## Utilisation

Installer Node.js >= 16 et NPM puis exécuter la commande suivante :

```bash
npx --package git+https://oauth2:$TOKEN@innersource.soprasteria.com/gael.girodon/dd-to-osdf.git \
  dd-to-osdf [options]
```

`dd-to-osdf --help` permet d'afficher le message d'aide.

Les options sont documentées ici : [`src/cli.js`](./src/cli.js#L38).

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
  --status "active,!out_of_scope"                          \
  --output "./secdebt"     --formats "csv,html"            \
  --config "./config.json"
```

Le fichier `config.json` (optionnel) permet de personnaliser la
[configuration](src/config.js#L12) de l'outil, par exemple :

```json
{
  "title": "Custom HTML report title",
  "criticities": ["unknown", "low", "moderate", "high", "critical"]
}
```
