from flask import Flask, render_template, request, redirect, url_for
# from flask_bootstrap import Bootstrap
from wtforms.validators import InputRequired, Length
from wtforms import SubmitField, TextField, SelectField
from data_retreiver import find_connections
import json
import pyodbc
from flask_wtf import Form
import os

cnxn = pyodbc.connect(
    'Connection string')
cursor = cnxn.cursor()
print(cnxn)

app = Flask(__name__)
app.secret_key = 'pa$$tilforms'
# Bootstrap(app)

# the form for creating the searchbar


class Search(Form):
    # the drop down menu
    choice = SelectField('Search Category', choices=[
                         ('virksomhed', 'Virksomhed'), ('ejer', 'Ejer'), ('leder', 'Leder')])
    # the search field
    value = TextField('Company ID', [InputRequired(), Length(min=3)])
    submit = SubmitField('Submit')

# the form for creating the Query node button


class QueryN(Form):
    hchoice = SelectField('Search Category', choices=[
                          ('virksomhed', 'Virksomhed'), ('ejer', 'Ejer'), ('leder', 'Leder')])
    hvalue = TextField('Company ID', [InputRequired(), Length(min=3)])
    qsubmit = SubmitField('Query Selected')


def rm_jsons():
    for filename in ['static/data1.json', 'static/data2.json', 'static/data3.json']:
        try:
            os.remove(filename)
        except OSError:
            pass


@app.route('/force1', methods=['POST', 'GET'])
def force1():

    data = ''
    form = Search()
    form2 = QueryN()
    # runs if user searches a custom node
    if request.method == 'POST' and form.validate():
        rm_jsons()
        idVal = request.form.get('value')  # the id of the node
        idCat = request.form.get('choice')  # the selected category

        find_connections(idVal, idVal, idCat, cnxn, cursor)

        return render_template('force1.html', form=form, form2=form2)

        # runs if user uses the query node button
    if request.method == 'POST' and form2.validate():
        rm_jsons()
        idVal = request.form.get('hvalue')
        idCat = request.form.get('hchoice')

        if idCat == 'virksomhed':
            find_connections(idVal, idVal, idCat, cnxn, cursor)
        else:
            find_connections(idVal, idVal[:-2], idCat, cnxn, cursor)

        return render_template('force1.html', form=form, form2=form2)

    return render_template('force1.html', form=form, form2=form2)


@app.route('/')
def index():
    return redirect(url_for('force1'))


# resolves some caching problem
@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


if __name__ == '__main__':
    app.run(debug=True)
