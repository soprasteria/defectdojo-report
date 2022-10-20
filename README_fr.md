# DefectDojo Report

[![Version](https://img.shields.io/github/package-json/v/soprasteria/defectdojo-report)](https://github.com/soprasteria/defectdojo-report/releases)
[![License](https://img.shields.io/github/license/soprasteria/defectdojo-report)](./LICENSE)
[![GitHub Actions Workflow status](https://github.com/soprasteria/defectdojo-report/actions/workflows/test.yml/badge.svg)](https://github.com/soprasteria/defectdojo-report/actions/workflows/test.yml)
[![README - English](https://img.shields.io/badge/readme-%F0%9F%87%AC%F0%9F%87%A7-blue)](./README.md)
[![README - French](https://img.shields.io/badge/readme-%F0%9F%87%AB%F0%9F%87%B7-blue)](./README_fr.md)

_DefectDojo Report_ est un outil conçu pour exporter la dette sécurité
d'une application depuis DefectDojo avec support de fonctionnalités
additionnelles :

- Calcul de la criticité résultante à partir de l'impact (`severity`), de la
  facilité d'exploitation (définie via un _tag_) et d'une matrice de
  correspondance
- Gestion d'informations complémentaires définies via des _tags_ :
  - Origine de l'audit
  - Correction de la vulnérabilité à la charge du prestataire de service
- Génération de rapports personnalisables aux formats HTML, CSV et JSON
- Concaténation de la dette associée à plusieurs produits

## Utilisation

Installer Node.js >= 16 et NPM puis exécuter les commandes suivantes :

```bash
npm i -g git+https://github.com/soprasteria/defectdojo-report.git
defectdojo-report [options]
```

`defectdojo-report --help` permet d'afficher le message d'aide.

Les options sont documentées ici : [`src/cli.js`](./src/cli.js#L38).

Un proxy peut être configuré en utilisant les variables d'environnement
`http_proxy`, `https_proxy` et `no_proxy` habituelles.

## Exemple

La commande suivante permet d'exporter la dette de sécurité associée au
produit `product-name` et à l'engagement `engagement-name` vers 2 fichiers
(`./secdebt.csv` et `./secdebt.html`) en incluant uniquement les vulnérabilités
actives et pas hors périmètre :

```bash
defectdojo-report                                          \
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

## Licence

_DefectDojo Report_ est fourni sous la GNU General Public License.
