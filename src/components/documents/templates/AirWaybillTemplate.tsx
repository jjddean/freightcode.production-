import React from 'react';
import { BrandLogo } from '../../ui/brand-logo';

export const AirWaybillTemplate = ({ data }: { data: any }) => {
    const doc = data.documentData || {};
    const parties = doc.parties || {};
    const route = doc.routeDetails || {};
    // Mock carrier if not present
    const carrierName = parties.carrier?.name || "Global Air Cargo Details";

    return (
        <div className="max-w-[210mm] mx-auto bg-white text-black p-6 font-mono text-xs">
            {/* Top Bar */}
            <div className="flex justify-between border-b-2 border-black pb-2 mb-4">
                <div>
                    <span className="text-[10px] block">AIR WAYBILL NO.</span>
                    <span className="text-xl font-bold">{doc.documentNumber}</span>
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-bold uppercase">{carrierName}</h1>
                    <p className="text-[10px]">NOT NEGOTIABLE</p>
                </div>
            </div>

            {/* Grid 1: Parties */}
            <div className="grid grid-cols-2 gap-px bg-black border border-black mb-4">
                <div className="bg-white p-2 h-32">
                    <h3 className="uppercase text-[9px] font-bold mb-1">Shipper's Name and Address</h3>
                    <div className="font-bold">{parties.shipper?.name}</div>
                    <div className="whitespace-pre-wrap">{parties.shipper?.address}</div>
                </div>
                <div className="bg-white p-2 h-32">
                    <h3 className="uppercase text-[9px] font-bold mb-1">Consignee's Name and Address</h3>
                    <div className="font-bold">{parties.consignee?.name}</div>
                    <div className="whitespace-pre-wrap">{parties.consignee?.address}</div>
                </div>
            </div>

            {/* Grid 2: Flight Info */}
            <div className="grid grid-cols-4 gap-px bg-black border border-black mb-4">
                <div className="bg-white p-2">
                    <h3 className="uppercase text-[9px] font-bold">Airport of Departure</h3>
                    <div className="text-lg font-bold">{route.origin}</div>
                </div>
                <div className="bg-white p-2">
                    <h3 className="uppercase text-[9px] font-bold">To</h3>
                    <div className="text-lg font-bold">{route.destination}</div>
                </div>
                <div className="bg-white p-2">
                    <h3 className="uppercase text-[9px] font-bold">By First Carrier</h3>
                    <BrandLogo size="sm" />
                </div>
                <div className="bg-white p-2">
                    <h3 className="uppercase text-[9px] font-bold">Airport of Destination</h3>
                    <div>{route.destination}</div>
                </div>
            </div>

            {/* Cargo Details */}
            <div className="border border-black mb-4 min-h-[200px]">
                <div className="grid grid-cols-12 border-b border-black text-[9px] font-bold uppercase bg-gray-100">
                    <div className="col-span-2 p-1 border-r border-black">No. of Pieces</div>
                    <div className="col-span-2 p-1 border-r border-black">Gross Weight</div>
                    <div className="col-span-1 p-1 border-r border-black">Rate Class</div>
                    <div className="col-span-2 p-1 border-r border-black">Chargeable Weight</div>
                    <div className="col-span-5 p-1">Nature and Quantity of Goods</div>
                </div>
                <div className="grid grid-cols-12 text-sm">
                    <div className="col-span-2 p-2 border-r border-black">{doc.cargoDetails?.description ? '1' : '-'}</div>
                    <div className="col-span-2 p-2 border-r border-black">{doc.cargoDetails?.weight}</div>
                    <div className="col-span-1 p-2 border-r border-black">M</div>
                    <div className="col-span-2 p-2 border-r border-black">{doc.cargoDetails?.weight}</div>
                    <div className="col-span-5 p-2 uppercase">
                        {doc.cargoDetails?.description}
                        <br /><br />
                        DIMS: {doc.cargoDetails?.dimensions}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="border border-black p-2 h-24">
                    <h3 className="uppercase font-bold mb-1">Handling Information</h3>
                    <p>NOTIFY CONSIGNEE IMMEDIATELY UPON ARRIVAL.</p>
                </div>
                <div className="border border-black p-2 h-24 flex flex-col justify-end">
                    <div className="border-t border-black pt-1 flex justify-between">
                        <span>Executed on {doc.issueDate}</span>
                        <span>Signature of Issuing Carrier</span>
                    </div>
                </div>
            </div>
            <div className="text-center mt-4 text-[9px] font-bold">ORIGINAL 3 (FOR SHIPPER)</div>
        </div>
    );
};
