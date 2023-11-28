import PocketBase, { FullListOptions, ListResult, RecordModel } from 'pocketbase'
import { Plugin } from '@slangroom/core'
import { z } from 'zod'

let pb:PocketBase;
const p = new Plugin()

const serverUrlSchema = z.literal(`http${z.union([z.literal('s'), z.literal('')])}://${z.string()}/`)
export type ServerUrl = z.infer<typeof serverUrlSchema>

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export type Credentials = z.infer<typeof credentialsSchema> 

const paginationSchema = z.object({
        page: z.number().int(),
        perPage: z.number().int(),
    })

const listParametersBaseSchema = z.object({
    collection: z.string(),
    sort: z.string().default('-created').optional(),
    expand: z.string().optional()
});

const listParametersSchema = z.discriminatedUnion("type", [
    listParametersBaseSchema.extend({ type: z.literal('all'), filter: z.string().optional() }),
    listParametersBaseSchema.extend({ type: z.literal('list'), filter: z.string().optional(), pagination: paginationSchema }),
    listParametersBaseSchema.extend({ type: z.literal('first'), filter: z.string() })
])

export type ListParameters = z.input<typeof listParametersSchema>


const isPbRunning = async () => {
    const res = await pb.health.check({ requestKey: null })
    if (res.code !== 200) return false
    return true
}

/**
 * @internal
 */
export const setupClient = p.new(['pb_address'], 'create pb_client', async (ctx)=> {
    const address = ctx.fetch('pb_address')
    if (typeof address !== 'string') return ctx.fail("Invalid address")
    try {
        pb = new PocketBase(address)
        const res = await pb.health.check({ requestKey: null })
        if (res.code !== 200) ctx.fail("server error")
        return ctx.pass("pb client successfully created")
    } catch(e) {
        return ctx.fail("Invalid address")
    }
})

/**
 * @internal
 */
export const authWithPassword = p.new(['my_credentials'], 'login', async (ctx) => {
    const credentials = ctx.fetch('my_credentials') as Credentials
    
    const validation = credentialsSchema.safeParse(credentials)
    if (!validation.success) return ctx.fail(validation.error)
    if (!(await isPbRunning())) return ctx.fail("Client is not running")
    
    try {
        const res = await pb.collection('users').authWithPassword(credentials!.email, credentials!.password)
        return ctx.pass({token:res.token, record: res.record})
    } catch (err) {
        return ctx.fail(err)
    }
})

/**
 * @internal
 */
export const getList = p.new(['list_parameters'], 'ask records', async (ctx) =>{
    const params = ctx.fetch('list_parameters') as ListParameters
    console.log(params)
    const validation = listParametersSchema.safeParse(params)
    console.log(validation)
    if (!validation.success) return ctx.fail(validation.error)

    const {collection, sort, filter, expand, type } = params
    if (!(await isPbRunning())) return ctx.fail("client is not working")
    
    let res: RecordModel | RecordModel[] | ListResult<RecordModel>
    const options:FullListOptions = {}
    if (sort) options.sort = sort
    if (filter) options.filter = filter
    if (expand) options['expand'] = expand
    if (type === "all") {
        res = await pb.collection(collection).getFullList(options)
    }
    else if (type === "list") {
        const {page, perPage } = params.pagination
        res = await pb.collection(collection).getList(page, perPage, options)
    }
    else {
        res = await pb.collection(collection).getFirstListItem(filter, options)
    }
    //@ts-expect-error JsonableObject should take also ListResult
    return ctx.pass({records:res})
})

export const pocketbase = p
