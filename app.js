import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import { getTrains, getAllTrains } from './src/getTrains'
import st from './src/stations.json'

const stations = st.filter(s => s.tgvmax_name !== 'TBD')

const app = express()
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.set('layout', '../layouts/layout')
app.set("layout extractScripts", true)
app.set("layout extractStyles", true)

const config = {
  port: process.env.PORT || 3000
}

function setLocals (res) {
  res.locals.title = ''
  res.locals.cities = [...new Set(stations.map(s => s.city_id))].map(id => stations.find(s => s.city_id === id))
}

app.get('/', (req, res) => {
  setLocals(res)

  res.render('index', {
    title: 'Toutes les villes',
    places: stations
  })
})

app.get('/from/:from/:year/:month/:day', async (req, res, next) => {
  setLocals(res)

  const fromStation = stations.find(s => s.city_id === req.params.from)
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getTrains(fromStation.tgvmax_name, undefined, date, 100, req.query.p)
    const page = parseInt(req.query.p || 0)
    const lastPage = Math.floor(data.total_count / 100)
    const trains = data.trains.map(t => ({
      ...t,
      from: stations.find(s => s.iata === t.from.iata),
      to: stations.find(s => s.iata === t.to.iata),
    }))

    res.render('trains', {
      title: `Trains depuis ${trains[0].from.city} le ${(new Date(date)).toLocaleDateString('fr-FR')}`,
      trains,
      date,
      page,
      lastPage
    })
  } catch (e) {
    next(e)
  }
})

app.get('/to/:to/:year/:month/:day', async (req, res, next) => {
  setLocals(res)

  const toStation = stations.find(s => s.city_id === req.params.to)
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getTrains(undefined, toStation.tgvmax_name, date, 100, req.query.p)
    const page = parseInt(req.query.p || 0)
    const lastPage = Math.floor(data.total_count / 100)
    const trains = data.trains.map(t => ({
      ...t,
      from: stations.find(s => s.iata === t.from.iata),
      to: stations.find(s => s.iata === t.to.iata),
    }))

    res.render('trains', {
      title: `Trains vers ${trains[0].to.city} le ${(new Date(date)).toLocaleDateString('fr-FR')}`,
      trains,
      date,
      page,
      lastPage
    })
  } catch (e) {
    next(e)
  }
})

app.get('/map/from/:from/:year/:month/:day', async (req, res, next) => {
  setLocals(res)

  const fromStation = stations.find(s => s.city_id === req.params.from)
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getAllTrains(fromStation.tgvmax_name, undefined, date)
    const trains = data.trains.map(t => ({
      ...t,
      from: stations.find(s => s.iata === t.from.iata),
      to: stations.find(s => s.iata === t.to.iata),
    }))

    res.render('map', {
      title: `Carte des trains depuis ${trains[0].from.city} le ${(new Date(date)).toLocaleDateString('fr-FR')}`,
      trains,
      date
    })
  } catch (e) {
    next(e)
  }
})

app.get('/map/to/:to/:year/:month/:day', async (req, res, next) => {
  setLocals(res)

  const toStation = stations.find(s => s.city_id === req.params.to)
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getAllTrains(undefined, toStation.tgvmax_name, date)
    const trains = data.trains.map(t => ({
      ...t,
      from: stations.find(s => s.iata === t.from.iata),
      to: stations.find(s => s.iata === t.to.iata),
    }))

    res.render('map', {
      title: `Carte des trains vers ${trains[0].to.city} le ${(new Date(date)).toLocaleDateString('fr-FR')}`,
      trains,
      date
    })
  } catch (e) {
    next(e)
  }
})

app.listen(config.port, () => console.log(`Server listening on http://localhost:${config.port}`))
