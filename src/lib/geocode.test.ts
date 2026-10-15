import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nearbySamplePoints, pointFromPhoton, streetFromNominatim, streetFromPhoton } from './geocode'

describe('geocoder parsing', () => {
  it('reads a street from Nominatim and Photon payloads', () => {
    assert.equal(streetFromNominatim({ road: 'Beacon Street', city: 'Boston' }), 'Beacon Street')
    assert.equal(streetFromNominatim(undefined), null)
    assert.equal(streetFromPhoton({ street: 'Charles Street' }), 'Charles Street')
    assert.equal(streetFromPhoton({ name: 'Arborway', osm_key: 'highway' }), 'Arborway')
    assert.deepEqual(pointFromPhoton({ geometry: { coordinates: [-71.07, 42.35] } }), { lat: 42.35, lng: -71.07 })
  })

  it('samples the current point and two nearby points', () => {
    const points = nearbySamplePoints(42.35, -71.07)
    assert.equal(points.length, 3)
    assert.deepEqual(points[0], { lat: 42.35, lng: -71.07 })
    assert.ok(points[1] && points[1].lat > 42.35)
    assert.ok(points[2] && points[2].lng > -71.07)
  })
})
