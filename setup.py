from setuptools import setup

setup (
	name = 'ordo',
	packages = ['ordo'],
	version = '0.4.0.dev0',
	description = 'A lightweight feedback tool for Jupyter',
	author = 'Andre J. Michell <andre.j.michell2@gmail.com>, Stefan Sobernig <stefan.sobernig@wu.ac.at>, Maxim Vidgof <maxim.vidgof@wu.ac.at>',
	author_email = 'ordo@alice.wu.ac.at',
	url = 'https://github.com/nm-wu/ordo',
	keywords = ['nbgallery', 'Jupyter', 'tutorial'],
	package_data = {'ordo': ['ordo.js', 'ordo.css'],},
    # jupyter-contrib-nbextensions reportedly does not like zipped eggs, disable them
    zip_safe=False
)
