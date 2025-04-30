# DefectDojo Report

[![Version](https://img.shields.io/npm/v/defectdojo-report)](https://www.npmjs.com/package/defectdojo-report)
[![License](https://img.shields.io/npm/l/defectdojo-report)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/defectdojo-report)](https://nodejs.org/download/)
[![GitHub Actions Workflow status](https://github.com/soprasteria/defectdojo-report/actions/workflows/test.yml/badge.svg)](https://github.com/soprasteria/defectdojo-report/actions/workflows/test.yml)
[![README - English](https://img.shields.io/badge/readme-%F0%9F%87%AC%F0%9F%87%A7-blue)](./README.md)
[![README - French](https://img.shields.io/badge/readme-%F0%9F%87%AB%F0%9F%87%B7-blue)](./README_fr.md)

_DefectDojo Report_ is a tool made to export the security debt of an
application from DefectDojo with support for additional features:

- Calculation of the resultant criticity from the impact (`severity`), the
  ease of exploitation (set using a _tag_) and a mapping matrix
- Support for additional information provided using _tags_:
  - Audit origin
  - Vulnerability fix under the service provider responsibility
- Generation of customizable reports in HTML, CSV and JSON formats
- Aggregation of the debt associated to multiple products

## Usage

Install Node.js >= 22 and NPM, then run the following commands:

```bash
npm i -g defectdojo-report
defectdojo-report [options]
```

Run `defectdojo-report --help` to show the help message.

Options are documented here: [`src/cli.js`](./src/cli.js#L15).

A proxy can be configured using the conventional `http_proxy`, `https_proxy`
and `no_proxy` environment variables.

## Example

The following command allows to export the security debt associated to the
product `product-name` and the engagement `engagement-name` to 2 files
(`./secdebt.csv` and `./secdebt.html`) including only active and not out of
scope vulnerabilities:

```bash
defectdojo-report                                          \
  --url "https://defectdojo.acme.corp:8080"                \
  --token "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"       \
  --product "product-name" --engagement "engagement-name"  \
  --status "active,!out_of_scope"                          \
  --output "./secdebt"     --format "csv,html"             \
  --config "./config.json"
```

The `config.json` file (optional) allows to customize the tool
[configuration](src/config.js#L12), e.g. :

```json
{
  "title": "Custom HTML report title",
  "criticities": ["unknown", "low", "moderate", "high", "critical"]
}
```

## License

_DefectDojo Report_ is licensed under the GNU General Public License.
