import json
from itertools import groupby
from operator import itemgetter
from collections import defaultdict
from threading import Thread
import numpy as np
import pandas as pd
import pyodbc

def deg1(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds):
    print('commited - Degree 1')
    Tlv1 = pd.read_sql_query('select * from dbo.Tlv1', cnxn)
    deg1 = pd.read_sql_query('select * from dbo.deg1', cnxn)
    # dfemp = pd.read_sql_query('select * from dbo.empf', cnxn)
    save_update_data(deg1, 1, ucenetr, center, dfemp, dfpred, dffrad, Tlv1, smnds)

def deg2(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds):
    cursor.execute("exec [dbo].[FindC2v7]")
    cnxn.commit()
    print('commited - Degree 2')
    Tlv2 = pd.read_sql_query('select * from dbo.Tlv2', cnxn)
    deg2 = pd.read_sql_query('select * from dbo.deg2', cnxn) 
    save_update_data(deg2, 2, ucenetr, center, dfemp, dfpred, dffrad, Tlv2, smnds)



# def deg_23(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds):
#     deg2(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds)
#     deg3(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds)

def retrieve_save(ucenetr, center, category, cnxn, cursor):
    cursor.execute("exec [dbo].[FindC1v7] ?, ?", center, category)
    cnxn.commit()
    dfemp = pd.read_sql_query('select * from dbo.empf', cnxn)
    dfpred = pd.read_sql_query('select * from dbo.predictions', cnxn)
    dffrad = pd.read_sql_query('select * from dbo.fradulant', cnxn)
    dfstrmnd = pd.read_sql_query('select cast([CPR_C10] as varchar) as strmnd from dbo.strmnds', cnxn)
    smnds = set(dfstrmnd.strmnd)
    deg1(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds)
    # deg2(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds)
    Q2 = Thread(target=deg2, args=(ucenetr, center, category, cnxn, cursor, dfemp, dfpred, dffrad, smnds))
    Q2.start()



def save_update_data(deg, degree, ucenetr, center, dfemp, dfpred, dffrad, Tt, smnds):
    nodeIDs = []
    res = defaultdict(defaultdict)
    secvrnrs = set(i for i in set(deg.sourceV).union(set(deg.targetV)))
    

    # creating the json formatted data
    # we create a dictionary withe key consisting of SENR/CVRNR (SECVRNR) and the value is also a dictionary
    # containing their informations
    T = dict(tuple(Tt.groupby('SECVRNR')))
    for secvrnr in secvrnrs:
        
        virkT = T[secvrnr]
        # virkT = Tt[Tt.SECVRNR == secvrnr]
        secvrnr = secvrnr.strip()
        probval = dfpred[dfpred.CVR_nummer == secvrnr]
        prob = 0 if len(probval) == 0 else float(probval.prob.values[0])  
        col = 'INTERESSENTID'
        prFradulancy = 0
        res[secvrnr]['hub'] = 'n'
        navner = [i.strip() for i in set(virkT['Navn']) if str(i) != 'nan' and i]
        res[secvrnr]['name'] = navner[0] if navner else ''

        branche = [i.strip() for i in virkT['Branche'] if str(i) != 'nan' and i]
        res[secvrnr]['Branche'] = branche[0] if branche else 'Ukendt'

        start_date = [i.strip() for i in virkT['StartDate'] if str(i) != 'nan' and i]
        res[secvrnr]['Start_date'] = start_date[0] if start_date else 'Ukendt'

        status = [i.strip() for i in virkT['STATUSKODE'] if str(i) != 'nan' and i]
        res[secvrnr]['Status'] = status[0] if status else 'Ukendt'

        res[secvrnr]['ids'] = [i.strip() for i in set(virkT[col]) if i]
        res[secvrnr]['ejerinfo'] = []
        res[secvrnr]['ejers'] = [i.strip() for i in set(virkT['EJERNR']) if i]
        if len(res[secvrnr]['ejers']) == 1:
            nr = virkT['EJERNR'].dropna().unique()
            navn = virkT['EJERNAVN'].dropna().unique()
            ejerNationalitet = virkT['ejerNationalitet'].dropna().unique()
            addr = virkT['ejerFullAddress'].dropna().unique()
            owned = virkT['ownedVirksomhed'].dropna().unique()
            stat = virkT['ejerStatsborgerskab'].dropna().unique()
            einfo = ( nr[0] if any(nr) else None
                    ,navn[0] if any(navn) else None
                    ,ejerNationalitet[0] if any(ejerNationalitet) else None
                    ,addr[0] if any(addr) else None
                    ,int(owned[0]) if any(owned) else None
                    , stat[0] if any(stat) else None
                    )
            res[secvrnr]['ejerinfo'] = [einfo]
        else:
            try:
                einfo = [(i.strip()
                        ,virkT[virkT['EJERNR'] == i].EJERNAVN.dropna().unique()[0]
                        ,virkT[virkT['EJERNR'] == i].ejerNationalitet.dropna().unique()[0]
                        ,virkT[virkT['EJERNR'] == i].ejerFullAddress.dropna().unique()[0]
                        ,int(virkT[virkT['EJERNR'] == i].ownedVirksomhed.dropna().unique()[0])
                        ,virkT[virkT['EJERNR'] == i].ejerStatsborgerskab.dropna().unique()[0]
                        )
                        for i in set(virkT.EJERNR) if i]
                res[secvrnr]['ejerinfo'] = [j for j in einfo]
            except:
                res[secvrnr]['ejerinfo'] = []
                

        res[secvrnr]['leders'] = [i.strip() for i in set(virkT.LEDERNR) if i]
        try:
            linfo = [(i.strip()
                    ,virkT[virkT['LEDERNR'] == i].LEDERNAVN.values[0]
                    ,virkT[virkT['LEDERNR'] == i].lederNationalitet.values[0]
                    ,virkT[virkT['LEDERNR'] == i].LEDERKODETYPETXT.values[0] 
                    ,virkT[virkT['LEDERNR'] == i].lederFullAddress.values[0]
                    ,int(virkT[virkT['LEDERNR'] == i].led.values[0])
                    ,virkT[virkT['LEDERNR'] == i].lederStatsborgerskab.values[0]
                    , True if i.strip() in smnds else False
                    )
                    for i in set(virkT['LEDERNR']) if i]
            res[secvrnr]['ledersinfo'] = [j for j in linfo]
        except:
                res[secvrnr]['ledersinfo'] = []

        res[secvrnr]['addresses'] = [i.strip().lower() for i in set(virkT.virksomhedFullAddress) if i]
        try:
            ainfo = [(i.strip()
                    ,int(virkT[virkT['virksomhedFullAddress'] == i].locatedNumber.values[0])
                    ,virkT[virkT['virksomhedFullAddress'] == i].addrGYLDIGFRA.values[0]
                    ,virkT[virkT['virksomhedFullAddress'] == i].addrGYLDIGTIL.values[0] 
                    )
                    for i in set(virkT.virksomhedFullAddress) if i]
            res[secvrnr]['addressinfo'] = [j for j in ainfo]
        except:
                res[secvrnr]['addressinfo'] = []
        
        
        res[secvrnr]['henids'] = [i.strip() for i in set(virkT['HenvisningINTERESSENTID2']) if i]
        res[secvrnr]['overids'] = [i.strip() for i in set(virkT['OverINTERESSENTID2']) if i]
        res[secvrnr]['overids'] = [i.strip() for i in set(virkT['OverINTERESSENTID2']) if i]
        
        res[secvrnr]['employees'] = [str(i).strip() for i in set(dfemp[dfemp.CVR_nummer == secvrnr].INDIVID_IDENT) if str(i) != 'nan' and i]
        # empCode = [str(i).strip() for i in query_all_tables('AntalAnsatteKode', leders, ejers, stats, addresses) if i]
        # res[secvrnr]['employees_count_code'] = empCode[0] if len(empCode) > 0 else 'Z'
        # res[secvrnr]['FradulantCount'] = [str(int(i)).strip() for i in query_all_tables('FradulantCount') if str(i) != 'nan' and i]
        
        res[secvrnr]['Fradulancy'] = 1 if secvrnr in [str(i).strip() for i in dffrad.CVR_nummer] else prob

        # print(res[secvrnr]['name'])

        

        # if the Virksomhed has any Hub resourses, it will be set as a hub
        # if set(dflim.FullAddress).intersection(set(addl.FullAddress)):
        #     res[secvrnr]['hub'] = 'y' 

        # if set(dflim.EJERNR).intersection(set(ejel.EJERNR)):
        #     res[secvrnr]['hub'] = 'y' 

        # if set(dflim.LEDERNR).intersection(set(ledl.LEDERNR)):
        #     res[secvrnr]['hub'] = 'y' 
                
  
    data = defaultdict(list)

    print("resourses")

    sources = [j for j in res.keys()]

    # this is the most time consuming part of the code, looping through all the SECVRNRs and adding the connections
    # if they exists
    # this part of the code most be reviewed for improvement
    for source in set(deg.sourceV):
        current_source_targets = deg[deg.sourceV == source].targetV
        targets = [j for j in set(current_source_targets) if j != source]
        for target in targets:
            connections = [
                            set(res[target]['ejers']).intersection(set(res[source]['ejers'])), 
                            set(res[target]['leders']).intersection(set(res[source]['leders'])),
                            set(res[target]['addresses']).intersection(set(res[source]['addresses'])),
                            set(res[target]['ids']).intersection(set(res[source]['henids'])) \
                            .union(set(res[source]['ids']).intersection(set(res[target]['henids']))),
                            set(res[target]['ids']).intersection(set(res[source]['overids'])) \
                            .union(set(res[source]['ids']).intersection(set(res[target]['overids']))),
                            set(res[target]['employees']).intersection(set(res[source]['employees'])),
                            set(res[target]['employees']).intersection(set(res[source]['leders'])),
                            set(res[target]['leders']).intersection(set(res[source]['employees']))
                          ]
            # if degree == 1:
            #     connections.append(set(res[target]['employees']).intersection(set(res[source]['employees'])))

                

            con_type = ''
            if connections[0]:
                add_link(nodeIDs, degree, 'e', 'ejer', source, res[source], target, res[target], sorted(list(connections[0])), data["nodes"], data["links"], smnds)
            if connections[1]:
                add_link(nodeIDs, degree, 'l', 'leder', source, res[source], target, res[target], sorted(list(connections[1])), data["nodes"], data["links"], smnds)
            if connections[2]:
                add_link(nodeIDs, degree, 'a', 'address', source, res[source], target, res[target], sorted(list(connections[2])), data["nodes"], data["links"], smnds)
            if connections[3]:
                add_link(nodeIDs, degree, 'h', 'henvisning', source, res[source], target, res[target], sorted(list(connections[3])), data["nodes"], data["links"], smnds)
            if connections[4]:
                add_link(nodeIDs, degree, 'o', 'over', source, res[source], target, res[target], sorted(list(connections[4])), data["nodes"], data["links"], smnds)
            # if degree == 1:
            if connections[5]:
                add_link(nodeIDs, degree, 'emp', 'employee',source, res[source], target, res[target], sorted(list(connections[5])), data["nodes"], data["links"], smnds)
            if connections[6] or connections[7]:
                add_link(nodeIDs, degree, 'empleder', 'employee_leder',source, res[source], target, res[target], sorted(list(connections[5])), data["nodes"], data["links"], smnds)

    for source in sources:
        # tranforming the resource file to a list of dictionaries
        node = defaultdict()
        node['id'] = source
        node['group'] = 'virksomhed'

        for prop in res[source].keys():           
            prop_val = res[source][prop]
            if prop in ['Fradulancy', 'name', 'Branche', 'Start_date', 'Status']:
                pass
            elif len(prop_val) > 1:
                prop_val = tuple(prop_val)
            else:
                prop_val = prop_val[0] if prop_val else ''
            node[prop] = prop_val
            # try:
            #     # print(node['name'])
            # except:
            #     pass
        data['nodes'].append(node)

    
    print("conns")
    # delete the duplicates
    # by setting checks on adding links, we can remove this part
    nodes = list(map(dict, frozenset(frozenset(i.items()) for i in data['nodes'])))
    links = list(map(dict, frozenset(frozenset(i.items()) for i in data['links'])))
    data['nodes'] = []

    # Add the resource strength
    node_size = defaultdict(int)
    # number of connections that represents the source
    links.sort(key=itemgetter('source'))
    for key, group in groupby(links, lambda item: item['source']):
        node_size[key] += len([i for i in group if i['type'] != 'res'])

    # number of connections that represents the target
    links.sort(key=itemgetter('target'))
    for key, group in groupby(links, lambda item: item['target']):
        node_size[key] += len([i for i in group])

    # by uncommenting the commented codes, we can remove the resources in the third degree 

    # if degree != 3:
    data["links"] = [i for i in links if i['type'] not in ['l', 'e', 'a']]
    # else:
    #     data["links"] = links


    # adding the connected_nodes property
    for node in nodes:       
        node['connected_nodes'] = node_size[node['id']]
        if 'hub' not in node.keys():
            node['hub'] = 'n'


    # adding hub resources to the network and adding their information to the Virksomhed
    # and then adding the nodes to data['nodes'] for exporting to file
    for node in nodes:
        
        # if 'hub' in node.keys() and node['hub'] == 'y':
                
        #     for addr in addl.FullAddress:
        #         addrm = addr.strip().lower()
        #         if 'addresses' in node.keys() and addrm in node['addresses']:
        #             addrm = addrm + 'ad'
        #             connected_nodes = int(list(addl[addl.FullAddress==addr].Connections)[0])
        #             address_hub = {'id':addrm, 'group':'address', 'type': 'res', 'hub':'y', 'connected_nodes': int(connected_nodes)}
        #             hub_link = {'source':node['id'], 'target':addrm, 'type': 'res', 'resource': 'address', 'strength': 1}
        #             hub_nodes = [i for i in nodes if i['id'] == addrm]
        #             if hub_nodes:
        #                 if 'hub' not in hub_nodes[0].keys():
        #                     hub_node = hub_nodes[0]
        #                     nodes[nodes.index(hub_node)]['connected_nodes'] = int(nodes[nodes.index(hub_node)]['connected_nodes']) + connected_nodes
        #                     nodes[nodes.index(hub_node)]['hub'] = 'y'
        #                     node['connected_nodes'] += int(connected_nodes)
        #             else:
        #                 nodes.append(address_hub)
        #                 node['connected_nodes'] += int(connected_nodes)
        #             if hub_link not in data["links"]:
        #                 data["links"].append(hub_link)


        #     for ldnr in ledl.LEDERNR:
        #         ldnrm = ldnr.strip().lower()
        #         if 'leders' in node.keys() and ldnrm in node['leders']:
        #             ldnrm += 'le'
        #             connected_nodes = int(list(ledl[ledl.LEDERNR==ldnr].Connections)[0])
        #             leder_hub = {'id':ldnrm, 'group':'leder', 'type': 'res', 'hub':'y', 'connected_nodes': int(connected_nodes)}
        #             hub_link = {'source':node['id'], 'target':ldnrm , 'type': 'res', 'resource': 'leder', 'strength': 1}
        #             hub_nodes = [i for i in nodes if i['id'] == ldnrm]
        #             # print(hub_nodes)
        #             if len(hub_nodes)>0:
        #                 if 'hub' not in hub_nodes[0].keys():

        #                     hub_node = hub_nodes[0]
        #                     nodes[nodes.index(hub_node)]['connected_nodes'] = int(nodes[nodes.index(hub_node)]['connected_nodes']) + connected_nodes
        #                     nodes[nodes.index(hub_node)]['hub'] = 'y'
        #                     node['connected_nodes'] += int(connected_nodes)
        #             else:
        #                 nodes.append(leder_hub)
        #                 node['connected_nodes'] += int(connected_nodes)
        #             if hub_link not in data["links"]:
        #                 data["links"].append(hub_link)



        #     for ejnr in ejel.EJERNR:
        #         ejnrm = ejnr.strip().lower()
        #         if 'ejers' in node.keys() and ejnrm in node['ejers']:
        #             ejnrm += 'ej'
        #             connected_nodes = int(list(ejel[ejel.EJERNR==ejnr].Connections)[0])
        #             ejer_hub = {'id':ejnrm, 'group':'ejer', 'type': 'res', 'hub':'y', 'connected_nodes': int(connected_nodes)}
        #             hub_link = {'source':node['id'], 'target':ejnrm, 'type': 'res', 'resource': 'ejer', 'strength': 1}
        #             hub_nodes = [i for i in nodes if i['id'] == ejnrm]
        #             # print(hub_nodes)
        #             if hub_nodes:
        #                 if 'hub' not in hub_nodes[0].keys():
        #                     hub_node = hub_nodes[0]
        #                     nodes[nodes.index(hub_node)]['connected_nodes'] = int(nodes[nodes.index(hub_node)]['connected_nodes']) + connected_nodes
        #                     nodes[nodes.index(hub_node)]['hub'] = 'y'
        #                     node['connected_nodes'] += int(connected_nodes)
        #             else:
        #                 nodes.append(ejer_hub)
        #                 node['connected_nodes'] += int(connected_nodes)
                        
        #             if hub_link not in data["links"]:
        #                 data["links"].append(hub_link)

        node['node_members'] = str(len(node['id'].split(',')))
        data['nodes'].append(node)


    # trying to fin and center the queried Node
    try:
        center_node = [i for i in data['nodes'] if i['id'] == ucenetr][0]
        del data['nodes'][data['nodes'].index(center_node)]
        data['nodes'].insert(0, center_node)
    except :
        pass

    with open('static/data{}.json'.format(degree), 'w') as target:
        json.dump(data, target)
    

# adding the links and resource nodes to the corresponding variable

def add_link(nodeIDs, degree, con_type, grp, source, sourceNode, target, targetNode, connections, nodes, links, smnds):
    link = {'source':source, 'target':target, 'type': con_type, 'resource':tuple(connections), 'strength': len(connections)}
    rev_link = {'source':target, 'target':source, 'type': con_type, 'resource':tuple(connections), 'strength': len(connections)}

    if rev_link not in links:
        links.append(link)

        # if degree != 3:

        if len(connections) == 1:
            rss = connections[0]  + grp[:2]
        else:
            rss = ', '.join(connections) + grp[:2]

        
        if grp not in ['henvisning', 'over', 'empleder']:
            node = {'id':rss, 'group':grp, 'type': 'res'}
            if grp == 'leder':
                ledinf = set([i for i in sourceNode['ledersinfo'] + targetNode['ledersinfo'] if i[0] in connections])
                if any([i in smnds for i in connections]):
                    smand = {'stmand': True}
                else:
                    smand = {'stmand': False}
                node.update({'ledersinfo': tuple(ledinf)})
                node.update(smand)

            if grp == 'ejer':
                ejerinf = set([i for i in sourceNode['ejerinfo'] + targetNode['ejerinfo'] if i[0] in connections])
                node.update({'ejerinfo': tuple(ejerinf)})

            if grp == 'address':
                addinf = set([i for i in sourceNode['addressinfo'] + targetNode['addressinfo'] if i[0].lower() in connections])
                node.update({'addressinfo': tuple(addinf)})

            if node['id'] not in nodeIDs:
                nodes.append(node)
                nodeIDs.append(node['id'])

            links.append({'source':source, 'target':rss, 'type': 'res', 'resource': grp, 'strength': 1})
            links.append({'source':target, 'target':rss, 'type': 'res', 'resource': grp, 'strength': 1})



# this function only action is to start the process
def find_connections(ucenetr, idval, idcat, cnxn, cursor):
    retrieve_save(ucenetr, idval, idcat, cnxn, cursor)





##################################################################################################



## NetworkX ##

# def get_nodes(data):
#     return [j[1] for dic in data['nodes'] for j in dic.items() if j[0] == 'id']

# def get_links(data):
#     links = []
#     for dic in data['links']:
#         i, j, k = dic.items()
#         links.append((i[1], j[1]))
#     return links

# def add_degc(degc, data):
#     for node in data['nodes']:
#         node['degree_centrality'] = degc[node['id']]

# def add_betc(betc, data):
#     for node in data['nodes']:
#         node['betweenness_centrality'] = betc[node['id']]

# def add_clqs(G, data):
#     clq_collection = dict()
#     for node in G.nodes():
#         clqs = nx.cliques_containing_node(G, node)
#         clq_collection[node] = clqs
#     for node in data['nodes']:
#         clqs = clq_collection[node['id']]
#         for i, clq in enumerate(clqs):
#             node['clique_{}'.format(i+1)] = clq
            


# def add_graph_properties(data):

#     G = nx.Graph()
#     G.add_nodes_from(get_nodes(data))
#     G.add_edges_from(get_links(data))
#     degc = nx.degree_centrality(G)
#     betc = nx.betweenness_centrality(G)
#     add_degc(degc, data)
#     add_betc(betc, data)
#     add_clqs(G, data)
