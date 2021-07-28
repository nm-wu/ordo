# ordo
A lightweight feedback  extension for Jupyter. Ordo allows users to add feedback messages in a cell's metadata. The feedback is appended to cell's output as a success or failure message based on the result the cell produces. 

### Installation
Install and enable ordo on your Jupyter server

```{shell}
curl -LO https://github.com/nm-wu/ordo/archive/refs/heads/main.zip
unzip main.zip
cd ordo-main/
jupyter nbextension install --py --sys-prefix ordo
jupyter nbextension enable --py ordo
```

### Installation (for development)

```{shell}
git clone git@github.com:nm-wu/ordo.git
cd ordo/
jupyter nbextension install --py --sys-prefix --symlink ordo
jupyter nbextension enable --py ordo 
```

### Examples
See [README.ipynb](README.ipynb) for examples. 
