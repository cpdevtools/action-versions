//import {} from '@actions/core'
import {context} from '@actions/github'


const branch = context.ref.slice("refs/heads/".length);


console.log('hi', branch);