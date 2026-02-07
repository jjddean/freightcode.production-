import React from 'react';
import { BrandLogo } from '../../ui/brand-logo';

// Standard Bill of Lading Template
// Designed for A4 Print

export const BillOfLadingTemplate = ({ data }: { data: any }) => {
    const doc = data.documentData || {};
    const parties = doc.parties || {};
    const cargo = doc.cargoDetails || {};
    const route = doc.routeDetails || {};

    return (
        <div className="max-w-[210mm] mx-auto bg-white text-black p-8 font-serif text-sm">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-wider">Bill of Lading</h1>
                    <p className="text-gray-600 mt-1">Negotiable / Original</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{doc.documentNumber || "DRAFT"}</h2>
                    <p>Date: {doc.issueDate || new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Parties Grid */}
            <div className="grid grid-cols-2 gap-0 border border-black mb-6">
                <div className="border-r border-black p-4 border-b">
                    <h3 className="uppercase text-xs font-bold text-gray-500 mb-1">Shipper / Exporter</h3>
                    <div className="whitespace-pre-wrap font-bold">{parties.shipper?.name}</div>
                    <div className="whitespace-pre-wrap">{parties.shipper?.address}</div>
                </div>
                <div className="p-4 border-b border-black">
                    <h3 className="uppercase text-xs font-bold text-gray-500 mb-1">Booking Ref</h3>
                    <div>{data.bookingId || "N/A"}</div>
                    <h3 className="uppercase text-xs font-bold text-gray-500 mt-4 mb-1">Export References</h3>
                    <div>{data._id}</div>
                </div>

                <div className="border-r border-black p-4">
                    <h3 className="uppercase text-xs font-bold text-gray-500 mb-1">Consignee</h3>
                    <div className="whitespace-pre-wrap font-bold">{parties.consignee?.name}</div>
                    <div className="whitespace-pre-wrap">{parties.consignee?.address}</div>
                </div>
                <div className="p-4">
                    <h3 className="uppercase text-xs font-bold text-gray-500 mb-1">Notify Party</h3>
                    <div className="whitespace-pre-wrap italic">Same as Consignee</div>
                </div>
            </div>

            {/* Route Grid */}
            <div className="grid grid-cols-4 gap-0 border border-black border-t-0 mb-6 -mt-6">
                <div className="p-2 border-r border-b border-black">
                    <h3 className="uppercase text-xs font-bold text-gray-500">Vessel / Voyage</h3>
                    <div>{route.vessel || "TBD"}</div>
                </div>
                <div className="p-2 border-r border-b border-black">
                    <h3 className="uppercase text-xs font-bold text-gray-500">Port of Loading</h3>
                    <div>{route.portOfLoading || route.origin}</div>
                </div>
                <div className="p-2 border-r border-b border-black">
                    <h3 className="uppercase text-xs font-bold text-gray-500">Port of Discharge</h3>
                    <div>{route.portOfDischarge || route.destination}</div>
                </div>
                <div className="p-2 border-b border-black">
                    <h3 className="uppercase text-xs font-bold text-gray-500">Place of Delivery</h3>
                    <div>{route.destination}</div>
                </div>
            </div>

            {/* Cargo Table */}
            <div className="border border-black mb-6">
                <div className="grid grid-cols-12 border-b border-black bg-gray-100 font-bold text-xs uppercase p-2">
                    <div className="col-span-2">Marks & Nos</div>
                    <div className="col-span-2">No. of Pkgs</div>
                    <div className="col-span-5">Description of Goods</div>
                    <div className="col-span-2">Gross Weight</div>
                    <div className="col-span-1">Measure</div>
                </div>
                <div className="grid grid-cols-12 p-4 min-h-[300px] text-sm">
                    <div className="col-span-2 whitespace-pre-wrap">{cargo.marks || "N/A"}</div>
                    <div className="col-span-2">{cargo.packages || "1"}</div>
                    <div className="col-span-5 whitespace-pre-wrap">{cargo.description}</div>
                    <div className="col-span-2">{cargo.weight}</div>
                    <div className="col-span-1">{cargo.dimensions}</div>
                </div>
            </div>

            {/* Footer / Terms */}
            <div className="grid grid-cols-2 gap-8 text-xs text-gray-600 mb-8">
                <div>
                    <p className="mb-2"><strong>Total Number of Packages:</strong> {cargo.packages || "ONE"} UNIT(S) ONLY.</p>
                    <p>RECEIVED by the Carrier the Goods as specified above in apparent good order and condition unless otherwise stated, to be transported to such place as agreed.</p>
                </div>
                <div className="border border-black p-4 h-32 flex flex-col justify-between">
                    <div>
                        <h3 className="uppercase font-bold mb-4">Signed for the Carrier</h3>
                        <BrandLogo size="sm" />
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between">
                        <span>Place: New York</span>
                        <span>Date: {doc.issueDate}</span>
                    </div>
                </div>
            </div>

            <div className="text-center text-[10px] text-gray-400">
                Page 1 of 1 &bull; {data._id}
            </div>
        </div>
    );
};
