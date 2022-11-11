import express from 'express'
import getTrains from './src/getTrains'
import st from './src/stations.json'
const stations = st.filter(s => s.tgvmax_name !== 'TBD')

const app = express()
app.set('view engine', 'ejs')

const config = {
  port: process.env.PORT || 3000
}

app.get('/', (req, res) => {
  res.render('index', { places: stations })
})

app.get('/from/:from/:year/:month/:day', async (req, res, next) => {
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

    res.render('from', { trains, date, page, lastPage })
  } catch (e) {
    next(e)
  }
})

app.get('/to/:to/:year/:month/:day', async (req, res, next) => {
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

    res.render('to', { trains, date, page, lastPage })
  } catch (e) {
    next(e)
  }
})

app.listen(config.port, () => console.log(`Server listening on http://localhost:${config.port}`))
