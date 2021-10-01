# ordo
A lightweight feedback  extension for Jupyter. Ordo allows users to add feedback messages in a cell's metadata. The feedback is appended to cell's output as a success or failure message based on the result the cell produces. 

### Installation
Install and enable ordo on your Jupyter server

```{shell}
curl -LO https://github.com/nm-wu/ordo/archive/refs/heads/main.zip
unzip main.zip
cd ordo-main/
pip install -e .
jupyter nbextension install --py --sys-prefix ordo
jupyter nbextension enable --py ordo
```

### Installation (for development)

```{shell}
git clone git@github.com:nm-wu/ordo.git
cd ordo/
pip install -e .
jupyter nbextension install --py --sys-prefix --symlink ordo
jupyter nbextension enable --py ordo 
```

### Configuration

To configure your ordo installation (e.g., to default into the
feedback mode) provide an `ordo` section to
`<config-dir>/nbconfig/notebook.json`:

1. Pick a configuration directory (`config-dir`) from `jupyter --paths`;
2. Create and/or edit `notebook.json` therein, to include:

```{json}
{
  "ordo": {
     "defaultSuccess": "Thumb up!",
     "defaultFailure": "Thumb down!",
     "enableModeToggle": false
  }
}
```

* `defaultSuccess` (string): The default success message, valid for
  for the scope of an entire notebook (maybe overriden on a
  cell-by-cell basis);
* `defaultFailure` (string): The default failure message, valid for
  for the scope of an entire notebook (maybe overriden on a
  cell-by-cell basis);
* `enableModeToggle` (boolean): Setting to `true` enables both command
  modes: authoring and feedback mode (as well as toggling between the
  two). `false` renders the notebook in feedback-only mode (no mode toggle
  available).

### Examples
See [README.ipynb](README.ipynb) for examples. 
