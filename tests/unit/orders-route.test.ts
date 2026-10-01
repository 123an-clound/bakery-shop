import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), coupon: vi.fn(), after: vi.fn(), email: vi.fn(),
  existing: null as unknown, products: [] as unknown[],
}));
vi.mock("next/server", async () => ({ ...await vi.importActual("next/server"), after: mocks.after }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRateLimit: () => ({allowed:true}), requestClientKey: () => "qa" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  rpc: mocks.rpc,
  from: () => {
    let type = "";
    const result = () => ({ error: null, data: type === "order" ? mocks.existing : type === "product" ? mocks.products : {data:{brand_name:{vi:"QA"},shipping:{fee:25000,free_from:500000}}} });
    const chain = { select: () => chain, eq: (key:string,value:string) => { if(key === "type") type=value; return chain; },
      in: () => chain, maybeSingle: async () => result(), then: (resolve: (value:unknown)=>unknown) => Promise.resolve(result()).then(resolve) };
    return chain;
  },
}) }));
vi.mock("@/lib/bakery/catalog", () => ({ getActiveCouponByCode: mocks.coupon }));
vi.mock("@/lib/bakery/settings-private", () => ({ getPrivateNotifyEmails: async () => [] }));
vi.mock("@/lib/email/client", () => ({ sendEmail: mocks.email }));
import { POST } from "@/app/api/orders/route";
import { orderInputSchema } from "@/lib/schemas/order-input";

const payload = { requestId:"a4625101-035e-4f54-9e42-a749705a3751",expectedTotal:125000,customerName:"QA",phone:"0900000000",address:{line:"QA",city:"QA"},deliveryAt:"2030-01-01T00:00:00Z",paymentMethod:"cod",items:[{productId:1,qty:1,options:{}}] };
const request = (input: unknown) => new Request("http://localhost/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ADMIN_SESSION_SECRET", "qa-only-secret-000000000000000000000");
  mocks.existing=null;
  mocks.products=[{id:1,data:{name:{vi:"QA Cake"},price:100000,stock:3,prep_time_hours:24}}];
  mocks.coupon.mockResolvedValue(null);
  mocks.rpc.mockResolvedValue({data:{code:"BK260930-1234",total:125000,created:true},error:null});
});
describe("POST orders with mocked service boundaries", () => {
  it("commits the server price, creates unpaid order and issues an HttpOnly receipt cookie", async () => {
    const response=await POST(request({...payload,total:1,payment_status:"paid"}));
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(mocks.rpc.mock.calls[0]![1].p_order.total).toBe(125000);
    expect(mocks.rpc.mock.calls[0]![1].p_order.payment_status).toBe("unpaid");
    expect(mocks.after).toHaveBeenCalledOnce();
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("does not create an order when the displayed total is stale", async () => {
    const response=await POST(request({...payload,expectedTotal:1}));
    expect(response.status).toBe(409); expect((await response.json()).error).toBe("price_changed");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not silently drop an invalid coupon", async () => {
    const response=await POST(request({...payload,couponCode:"GONE"}));
    expect((await response.json()).error).toBe("coupon_invalid"); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("fails closed when the transaction is unavailable and sends no email", async () => {
    const log=vi.spyOn(console,"error").mockImplementation(()=>{});
    mocks.rpc.mockResolvedValue({error:{message:"missing database function"},data:null});
    const response=await POST(request(payload));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({error:"server_error"});
    expect(mocks.after).not.toHaveBeenCalled(); log.mockRestore();
  });
  it("replays a committed request before repricing or resending notifications", async () => {
    const parsed=orderInputSchema.parse(payload);
    mocks.existing={data:{code:"BK260930-1234",request_hash:createHash("sha256").update(JSON.stringify({...parsed,userId:null})).digest("hex"),customer_name:"QA",phone:payload.phone,address:payload.address,delivery_at:payload.deliveryAt,payment_method:"cod",subtotal:100000,total:125000,items_snapshot:[{product_id:1,name:"QA",unit_price:100000,qty:1,line_total:100000}]}};
    const response=await POST(request(payload));
    expect(response.status).toBe(200); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.after).not.toHaveBeenCalled();
  });
  it("rejects missing retry key and timezone-less timestamps", async () => {
    expect((await POST(request({...payload,requestId:undefined}))).status).toBe(400);
    expect((await POST(request({...payload,deliveryAt:"2030-01-01T12:00"}))).status).toBe(400);
  });
});
